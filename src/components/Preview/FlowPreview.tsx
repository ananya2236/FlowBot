"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bot, Send, Sparkles, X } from 'lucide-react';
import useStore, { type Bot as BotType } from '@/lib/store';
import {
  BubbleBlock,
  BubbleAttachmentSource,
  ConditionBlock,
  GroupNodeData,
  InputBlock,
  LogicBlock,
  SetVariableBlock,
  evaluateCondition,
  findBlockEdge,
  getBubbleAttachmentUrl,
  getBlockSummary,
  getInputBranchKey,
  getInputBranches,
  migrateToBlocks,
  resolveTemplate,
  sanitizeFlowEdges,
  validateInputBlock,
} from '@/lib/blocks';
import { getAvatarRadius, getTemplatePreviewStyle, normalizeThemeSettings, withOpacity } from '@/lib/theme';

interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  contentType: 'text' | 'image' | 'video' | 'audio' | 'embed';
  content: string;
  attachmentSource?: BubbleAttachmentSource;
  attachmentName?: string;
}

interface FlowPreviewProps {
  bot: BotType;
  className?: string;
  showHeader?: boolean;
  headerLabel?: string;
  onClose?: () => void;
  syncPreviewNode?: boolean;
  showVariables?: boolean;
}

function createMessage(
  type: Message['type'],
  contentType: Message['contentType'],
  content: string,
  attachmentSource?: BubbleAttachmentSource,
  attachmentName?: string
): Message {
  return {
    id: Math.random().toString(36).slice(2, 11),
    type,
    contentType,
    content,
    attachmentSource,
    attachmentName,
  };
}

export default function FlowPreview({
  bot,
  className = '',
  showHeader = true,
  headerLabel = 'Preview',
  onClose,
  syncPreviewNode = false,
  showVariables = true,
}: FlowPreviewProps) {
  const setPreviewNodeId = useStore((state) => state.setPreviewNodeId);
  const theme = normalizeThemeSettings(bot.theme);
  const safeEdges = useMemo(() => sanitizeFlowEdges(bot.edges, bot.nodes), [bot.edges, bot.nodes]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [pendingInput, setPendingInput] = useState<InputBlock | null>(null);
  const [answeredInputCount, setAnsweredInputCount] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cloudFileLink, setCloudFileLink] = useState('');
  const variablesRef = useRef<Record<string, string>>({});
  const stepCounterRef = useRef(0);
  const bubbleCounterRef = useRef(0);

  const getTypingDelay = useCallback(
    (content: string) => {
      const typingSettings = bot.settings?.typing;
      if (!typingSettings?.typingEmulation) return 0;
      bubbleCounterRef.current += 1;
      if (typingSettings.disableOnFirstMessage && bubbleCounterRef.current === 1) return 0;

      const wordCount = Math.max(1, content.trim().split(/\s+/).filter(Boolean).length);
      const wordsPerMinute = Math.max(60, typingSettings.wordsPerMinute || 400);
      const basedOnWords = (wordCount / wordsPerMinute) * 60 * 1000;
      const cappedDelay = Math.min(
        basedOnWords,
        Math.max(0, typingSettings.maxDelaySeconds || 0) * 1000
      );
      return cappedDelay + Math.max(0, typingSettings.delayBetweenMessagesSeconds || 0) * 1000;
    },
    [bot.settings]
  );

  const totalBlocks = useMemo(
    () =>
      bot.nodes.reduce((count, node) => {
        const groupData = node.data as GroupNodeData | undefined;
        return count + migrateToBlocks(groupData ?? {}).length;
      }, 0),
    [bot.nodes]
  );

  const totalInputs = useMemo(
    () =>
      bot.nodes.reduce((count, node) => {
        const groupData = node.data as GroupNodeData | undefined;
        return count + migrateToBlocks(groupData ?? {}).filter((block) => block.kind === 'input').length;
      }, 0),
    [bot.nodes]
  );

  const progressPercent = useMemo(() => {
    if (totalInputs > 0) {
      if (answeredInputCount <= 0) return pendingInput ? Math.max(6, Math.round(100 / totalInputs) - 4) : 0;
      return Math.min(100, Math.round((answeredInputCount / totalInputs) * 100));
    }
    if (totalBlocks <= 0) return 0;
    if (!currentNodeId) return messages.length > 0 ? 100 : 0;

    let traversedBlocks = 0;
    for (const node of bot.nodes) {
      if (node.id === currentNodeId) break;
      traversedBlocks += migrateToBlocks((node.data as GroupNodeData | undefined) ?? {}).length;
    }

    const currentProgress = traversedBlocks + currentBlockIndex + (pendingInput ? 1 : 0);
    return Math.max(4, Math.min(100, Math.round((currentProgress / totalBlocks) * 100)));
  }, [answeredInputCount, bot.nodes, currentBlockIndex, currentNodeId, messages.length, pendingInput, totalBlocks, totalInputs]);

  useEffect(() => {
    if (!syncPreviewNode) {
      setPreviewNodeId(null);
      return;
    }
    setPreviewNodeId(currentNodeId);
    return () => setPreviewNodeId(null);
  }, [currentNodeId, setPreviewNodeId, syncPreviewNode]);

  const pushMessage = useCallback((message: Message) => {
    setMessages((previous) => [...previous, message]);
  }, []);

  const executeBlock = useCallback(async function runBlocks(
    nodeId: string,
    startIndex: number,
    runtimeVariables: Record<string, string>
  ) {
    stepCounterRef.current += 1;
    if (stepCounterRef.current > 250) {
      pushMessage(
        createMessage(
          'system',
          'text',
          'Preview stopped: possible loop detected (over 250 execution steps). Check your edges for circular paths.'
        )
      );
      setPendingInput(null);
      setCurrentNodeId(null);
      return;
    }

    const node = bot.nodes.find((item) => item.id === nodeId);
    if (!node) {
      pushMessage(createMessage('system', 'text', `Preview error: target node "${nodeId}" not found.`));
      return;
    }

    const groupData = node.data as GroupNodeData;
    const blocks = migrateToBlocks(groupData);

    setCurrentNodeId(nodeId);
    setCurrentBlockIndex(startIndex);
    setPendingInput(null);
    setValidationError(null);

    for (let index = startIndex; index < blocks.length; index += 1) {
      const block = blocks[index];
      setCurrentBlockIndex(index);

      if (block.kind === 'bubble') {
        const bubble = block as BubbleBlock;
        const resolvedContent = resolveTemplate(getBubbleAttachmentUrl(bubble), runtimeVariables);
        const typingDelay = getTypingDelay(resolvedContent);
        setIsTyping(true);
        if (typingDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, typingDelay));
        }
        pushMessage(createMessage('bot', bubble.type, resolvedContent, bubble.attachmentSource, bubble.attachmentName));
        setIsTyping(false);

        const nextEdge = findBlockEdge(safeEdges, nodeId, bubble.id);
        if (nextEdge) {
          await runBlocks(nextEdge.target, 0, runtimeVariables);
          return;
        }

        continue;
      }

      if (block.kind === 'input') {
        const input = block as InputBlock;
        setPendingInput({
          ...input,
          prompt: resolveTemplate(input.prompt, runtimeVariables),
          placeholder: resolveTemplate(input.placeholder, runtimeVariables),
        });
        setCurrentNodeId(nodeId);
        setCurrentBlockIndex(index);
        return;
      }

      const logic = block as LogicBlock;

      if (logic.type === 'set_variable') {
        const setVariable = logic as SetVariableBlock;
        const nextVariables = {
          ...runtimeVariables,
          [setVariable.variable]: resolveTemplate(setVariable.value, runtimeVariables),
        };

        variablesRef.current = nextVariables;
        setVariables(nextVariables);
        pushMessage(createMessage('system', 'text', `Set ${setVariable.variable} = ${nextVariables[setVariable.variable]}`));

        const nextEdge = findBlockEdge(safeEdges, nodeId, setVariable.id);
        if (nextEdge) {
          await runBlocks(nextEdge.target, 0, nextVariables);
          return;
        }

        runtimeVariables = nextVariables;
        continue;
      }

      if (logic.type === 'condition') {
        const condition = logic as ConditionBlock;
        const result = evaluateCondition(condition, runtimeVariables);
        pushMessage(
          createMessage(
            'system',
            'text',
            `Condition "${getBlockSummary(condition, runtimeVariables)}" evaluated to ${result ? 'true' : 'false'}.`
          )
        );

        const branchEdge = findBlockEdge(safeEdges, nodeId, condition.id, result ? 'true' : 'false');
        if (branchEdge) {
          await runBlocks(branchEdge.target, 0, runtimeVariables);
          return;
        }

        continue;
      }

      pushMessage(createMessage('system', 'text', resolveTemplate(logic.label, runtimeVariables)));
      const nextEdge = findBlockEdge(safeEdges, nodeId, logic.id);
      if (nextEdge) {
        await runBlocks(nextEdge.target, 0, runtimeVariables);
        return;
      }
    }

    const fallbackEdge = findBlockEdge(safeEdges, nodeId, null);
    if (fallbackEdge) {
      await runBlocks(fallbackEdge.target, 0, runtimeVariables);
      return;
    }

    setCurrentNodeId(null);
    setPendingInput(null);
    pushMessage(createMessage('system', 'text', `Flow ended at node "${nodeId}".`));
  }, [bot.nodes, getTypingDelay, pushMessage, safeEdges]);

  useEffect(() => {
    setMessages([]);
    setVariables({});
    variablesRef.current = {};
    stepCounterRef.current = 0;
    bubbleCounterRef.current = 0;
    setCurrentNodeId(null);
    setCurrentBlockIndex(0);
    setPendingInput(null);
    setAnsweredInputCount(0);
    setUserInput('');
    setValidationError(null);

    if (bot.nodes.length === 0) {
      pushMessage(createMessage('system', 'text', 'Add at least one node to run this preview.'));
      return;
    }

    const startNode = bot.nodes.find((node) => node.type === 'start') || bot.nodes[0];
    const firstEdge = safeEdges.find((edge) => edge.source === startNode.id);
    if (!firstEdge) {
      pushMessage(createMessage('system', 'text', 'Connect the start node to a group to run this preview.'));
      return;
    }

    void executeBlock(firstEdge.target, 0, {});
  }, [bot.id, bot.nodes, executeBlock, pushMessage, safeEdges]);

  const submitInputValue = async (rawValue: string) => {
    if (!pendingInput || !currentNodeId) return;

    const error = validateInputBlock(pendingInput, rawValue);
    if (error) {
      setValidationError(error);
      return;
    }

    const value = rawValue.trim();
    const nextVariables = {
      ...variablesRef.current,
      [pendingInput.variable]: value,
    };

    variablesRef.current = nextVariables;
    setVariables(nextVariables);
    setAnsweredInputCount((count) => count + 1);
    setValidationError(null);
    pushMessage(createMessage('user', 'text', value));
    setUserInput('');
    setCloudFileLink('');

    const branches = getInputBranches(pendingInput);
    const selectedBranch = branches.find((branch) => branch.value === value);
    const branchEdge = selectedBranch
      ? findBlockEdge(safeEdges, currentNodeId, pendingInput.id, getInputBranchKey(selectedBranch.value))
      : null;

    if (branchEdge) {
      setPendingInput(null);
      await executeBlock(branchEdge.target, 0, nextVariables);
      return;
    }

    const edge = findBlockEdge(safeEdges, currentNodeId, pendingInput.id);
    if (edge) {
      setPendingInput(null);
      await executeBlock(edge.target, 0, nextVariables);
      return;
    }

    setPendingInput(null);
    await executeBlock(currentNodeId, currentBlockIndex + 1, nextVariables);
  };

  const handleUserInput = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitInputValue(userInput);
  };

  const getInputType = () => {
    if (!pendingInput) return 'text';
    switch (pendingInput.type) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      case 'time':
        return 'time';
      case 'email':
        return 'email';
      case 'website':
        return 'url';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  const requiresManualTyping = pendingInput
    ? pendingInput.type === 'buttons' || pendingInput.type === 'pic_choice' || pendingInput.type === 'cards'
      ? !(pendingInput.options?.some((option) => option.value.trim()) ?? false)
      : pendingInput.type === 'payment'
        ? !(pendingInput.paymentMethods?.some((method) => method.value.trim()) ?? false)
        : !['rating', 'file'].includes(pendingInput.type)
    : true;

  const previewStyle = {
    ...getTemplatePreviewStyle(theme),
    fontFamily: theme.fontFamily,
    borderRadius: `${theme.borderRadius + 8}px`,
    borderColor: withOpacity(theme.borderColor, 0.25),
  } as React.CSSProperties;

  const renderInlineInputActions = () => {
    if (!pendingInput) return null;

    if ((pendingInput.type === 'buttons' || pendingInput.type === 'pic_choice' || pendingInput.type === 'cards')
      && pendingInput.options?.filter((option) => option.value.trim()).length) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {pendingInput.options.filter((option) => option.value.trim()).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => void submitInputValue(option.value)}
              className="rounded-xl border px-3 py-2 text-[11px] font-semibold"
              style={{
                borderColor: withOpacity(theme.borderColor, 0.16),
                background: withOpacity(theme.cardBackground, 0.92),
                color: theme.cardTextColor,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    if (pendingInput.type === 'rating') {
      return (
        <div className="mt-3 flex items-center gap-2">
          {Array.from({ length: pendingInput.ratingScale || 5 }).map((_, index) => {
            const rating = String(index + 1);
            return (
              <button
                key={rating}
                type="button"
                onClick={() => void submitInputValue(rating)}
                className="h-8 w-8 rounded-full border text-[11px] font-bold"
                style={{
                  borderColor: withOpacity(theme.borderColor, 0.16),
                  background: withOpacity(theme.cardBackground, 0.92),
                  color: theme.cardTextColor,
                }}
              >
                {rating}
              </button>
            );
          })}
        </div>
      );
    }

    if (pendingInput.type === 'file') {
      return (
        <div className="mt-3 space-y-2">
          {(pendingInput.fileSources || []).includes('device') ? (
            <input
              type="file"
              multiple={pendingInput.allowMultipleFiles}
              accept={pendingInput.acceptedFileTypes}
              onChange={(event) => {
                const files = event.target.files;
                if (!files || files.length === 0) return;
                void submitInputValue(Array.from(files).map((file) => file.name).join(', '));
              }}
              className="w-full rounded-xl border px-3 py-2 text-xs"
              style={{
                borderColor: withOpacity(theme.borderColor, 0.16),
                background: withOpacity(theme.cardBackground, 0.92),
                color: theme.cardTextColor,
              }}
            />
          ) : null}

          {(pendingInput.fileSources || []).includes('cloudLink') ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={cloudFileLink}
                onChange={(event) => setCloudFileLink(event.target.value)}
                placeholder="Paste cloud file link"
                className="flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
                style={{
                  borderColor: withOpacity(theme.borderColor, 0.16),
                  background: withOpacity(theme.cardBackground, 0.92),
                  color: theme.cardTextColor,
                }}
              />
              <button
                type="button"
                onClick={() => void submitInputValue(cloudFileLink)}
                disabled={!cloudFileLink.trim()}
                className="rounded-xl px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
                style={{ background: theme.accentColor, color: theme.accentTextColor }}
              >
                Use link
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    if (pendingInput.type === 'payment') {
      return (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => void submitInputValue('paid')}
            className="w-full rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: withOpacity(theme.accentColor, 0.12), color: theme.accentColor }}
          >
            Mark as paid ({pendingInput.currency || 'USD'} {pendingInput.amount || 0})
          </button>
          {pendingInput.paymentMethods?.filter((method) => method.value.trim()).length ? (
            <div className="grid grid-cols-2 gap-2">
              {pendingInput.paymentMethods.filter((method) => method.value.trim()).map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => void submitInputValue(method.value)}
                  className="rounded-xl border px-3 py-2 text-[11px] font-semibold"
                  style={{
                    borderColor: withOpacity(theme.borderColor, 0.16),
                    background: withOpacity(theme.cardBackground, 0.92),
                    color: theme.cardTextColor,
                  }}
                >
                  {method.label || method.value}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`flex h-full w-full flex-col overflow-hidden border ${className}`} style={previewStyle}>
      {theme.enableProgressBar ? (
        <div className="px-5 pt-4">
          <div className="h-2 overflow-hidden rounded-full bg-black/8">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%`, background: theme.accentColor }} />
          </div>
        </div>
      ) : null}

      {showHeader ? (
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ background: withOpacity(theme.cardBackground, 0.96), borderColor: withOpacity(theme.borderColor, 0.16) }}
        >
          <div className="flex items-center gap-3">
            {theme.showAvatar ? (
              <div
                className="flex h-10 w-10 items-center justify-center text-sm font-semibold"
                style={{
                  background: theme.accentColor,
                  color: theme.accentTextColor,
                  borderRadius: getAvatarRadius(theme.avatarShape),
                }}
              >
                {bot.name.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Bot size={18} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold" style={{ color: theme.cardTextColor }}>{bot.name || 'Chatbot'}</h3>
              <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: withOpacity(theme.cardTextColor, 0.55) }}>
                {headerLabel}
              </div>
            </div>
          </div>
          {onClose ? (
            <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-black/5">
              <X size={18} style={{ color: withOpacity(theme.cardTextColor, 0.6) }} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                message.type === 'user' ? 'rounded-tr-none' : message.type === 'system' ? '' : 'rounded-tl-none'
              }`}
              style={
                message.type === 'user'
                  ? { background: theme.userBubbleColor, color: theme.userTextColor }
                  : message.type === 'system'
                    ? { background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ede9fe' }
                    : {
                        background: theme.botBubbleColor,
                        color: theme.botTextColor,
                        border: `1px solid ${withOpacity(theme.borderColor, 0.12)}`,
                      }
              }
            >
              {message.contentType === 'text' ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p> : null}
              {message.contentType !== 'text' ? (
                <MediaCard
                  label={message.contentType}
                  contentType={message.contentType}
                  content={message.content}
                  attachmentName={message.attachmentName}
                />
              ) : null}
            </div>
          </div>
        ))}

        {pendingInput ? (
          <div className="flex justify-start">
            <div
              className="max-w-[92%] rounded-2xl rounded-tl-none border px-4 py-3 shadow-sm"
              style={{
                background: withOpacity(theme.cardBackground, 0.96),
                color: theme.cardTextColor,
                borderColor: withOpacity(theme.borderColor, 0.12),
              }}
            >
              <p className="text-sm font-medium">{pendingInput.prompt}</p>
              <div className="mt-2 text-xs" style={{ color: withOpacity(theme.cardTextColor, 0.6) }}>
                Saving as <span className="font-semibold">{pendingInput.variable}</span>
              </div>
              {renderInlineInputActions()}
            </div>
          </div>
        ) : null}

        {isTyping ? (
          <div className="flex justify-start">
            <div
              className="flex gap-1 rounded-2xl border px-4 py-2"
              style={{ background: withOpacity(theme.cardBackground, 0.96), borderColor: withOpacity(theme.borderColor, 0.12) }}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="border-t p-4"
        style={{ background: withOpacity(theme.cardBackground, 0.98), borderColor: withOpacity(theme.borderColor, 0.16) }}
      >
        {validationError ? (
          <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        ) : null}

        {showVariables && Object.keys(variables).length > 0 ? (
          <div
            className="mb-3 rounded-2xl border px-3 py-3"
            style={{ borderColor: withOpacity(theme.borderColor, 0.12), background: withOpacity(theme.cardBackground, 0.92) }}
          >
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: withOpacity(theme.cardTextColor, 0.62) }}>
              <Sparkles size={12} />
              Captured variables
            </div>
            <div className="space-y-1 text-xs" style={{ color: withOpacity(theme.cardTextColor, 0.78) }}>
              {Object.entries(variables).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{key}</span>
                  <span className="truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleUserInput} className="flex items-center gap-2">
          <input
            type={getInputType()}
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            placeholder={pendingInput?.placeholder || 'The flow will pause here when input is needed'}
            disabled={!pendingInput || !requiresManualTyping}
            className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: theme.inputBackground, color: theme.inputTextColor }}
          />
          {pendingInput?.type === 'phone' ? (
            <span className="rounded-xl px-2 py-1 text-xs font-semibold" style={{ background: withOpacity(theme.borderColor, 0.08), color: withOpacity(theme.cardTextColor, 0.7) }}>
              {pendingInput.phoneCountryCode || '+91'}
            </span>
          ) : null}
          <button
            type="submit"
            disabled={!pendingInput || !requiresManualTyping || !userInput.trim()}
            className="flex h-11 min-w-11 items-center justify-center rounded-full transition-all disabled:opacity-50"
            style={{ background: theme.accentColor, color: theme.accentTextColor }}
          >
            {pendingInput?.buttonLabel ? <span className="px-3 text-xs font-semibold">{pendingInput.buttonLabel}</span> : <Send size={18} />}
          </button>
        </form>

        {theme.showBranding ? (
          <div className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] font-semibold" style={{ color: withOpacity(theme.cardTextColor, 0.6) }}>
            <span
              className="flex h-5 w-5 items-center justify-center"
              style={{
                background: withOpacity(theme.accentColor, 0.12),
                color: theme.accentColor,
                borderRadius: '999px',
              }}
            >
              <Bot size={12} />
            </span>
            Powered by Spinabot
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MediaCard({
  label,
  contentType,
  content,
  attachmentName,
}: {
  label: string;
  contentType: 'image' | 'video' | 'audio' | 'embed';
  content: string;
  attachmentName?: string;
}) {
  return (
    <div className="rounded-lg bg-white/70 p-3 text-xs text-slate-500">
      <div className="font-semibold capitalize text-slate-700">{label}</div>
      {contentType === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={content} alt={attachmentName || 'Bubble image'} className="mt-2 max-h-56 w-full rounded-md object-cover" />
      ) : null}
      {contentType === 'video' ? <video src={content} controls className="mt-2 max-h-56 w-full rounded-md" /> : null}
      {contentType === 'audio' ? <audio src={content} controls className="mt-2 w-full" /> : null}
      {contentType === 'embed' ? <div className="mt-1 break-all">{content || 'No embed source provided.'}</div> : null}
      {contentType !== 'embed' && attachmentName ? <div className="mt-2 text-[11px]">{attachmentName}</div> : null}
      {!content && contentType !== 'embed' ? <div className="mt-1 break-all">{`No ${label.toLowerCase()} source provided.`}</div> : null}
    </div>
  );
}
