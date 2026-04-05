"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Send, Bot, AlertCircle, Sparkles } from 'lucide-react';
import useStore from '@/lib/store';
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
  getInputBranchKey,
  getInputBranches,
  getBubbleAttachmentUrl,
  getBlockSummary,
  migrateToBlocks,
  resolveTemplate,
  sanitizeFlowEdges,
  validateInputBlock,
} from '@/lib/blocks';

interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  contentType: 'text' | 'image' | 'video' | 'audio' | 'embed';
  content: string;
  attachmentSource?: BubbleAttachmentSource;
  attachmentName?: string;
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

export default function PreviewModal({
  isOpen,
  onClose,
  botId,
}: {
  isOpen: boolean;
  onClose: () => void;
  botId?: string;
}) {
  const { bots, activeBotId, setPreviewNodeId } = useStore();
  const activeBot = bots.find((bot) => bot.id === (botId || activeBotId));
  const safeEdges = useMemo(() => {
    if (!activeBot) return [];
    return sanitizeFlowEdges(activeBot.edges, activeBot.nodes);
  }, [activeBot]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [pendingInput, setPendingInput] = useState<InputBlock | null>(null);
  const [userInput, setUserInput] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cloudFileLink, setCloudFileLink] = useState('');
  const variablesRef = useRef<Record<string, string>>({});
  const stepCounterRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setPreviewNodeId(null);
      return;
    }
    setPreviewNodeId(currentNodeId);
  }, [currentNodeId, isOpen, setPreviewNodeId]);

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

    const node = activeBot?.nodes.find((item) => item.id === nodeId);
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
        setIsTyping(true);
        await new Promise((resolve) => setTimeout(resolve, 350));
        const resolvedContent = resolveTemplate(getBubbleAttachmentUrl(bubble), runtimeVariables);
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
        pushMessage(
          createMessage(
            'system',
            'text',
            `Set ${setVariable.variable} = ${nextVariables[setVariable.variable]}`
          )
        );

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

        pushMessage(
          createMessage(
            'system',
            'text',
            `No ${result ? 'true' : 'false'} branch edge connected for condition "${condition.variable}".`
          )
        );

        continue;
      }

      pushMessage(createMessage('system', 'text', resolveTemplate(logic.label, runtimeVariables)));
      const nextEdge = findBlockEdge(safeEdges, nodeId, logic.id);
      if (nextEdge) {
        await runBlocks(nextEdge.target, 0, runtimeVariables);
        return;
      }

      pushMessage(createMessage('system', 'text', `${logic.type} block has no connected edge.`));
    }

    const fallbackEdge = findBlockEdge(safeEdges, nodeId, null);
    if (fallbackEdge) {
      await runBlocks(fallbackEdge.target, 0, runtimeVariables);
      return;
    }

    setCurrentNodeId(null);
    setPendingInput(null);
    pushMessage(createMessage('system', 'text', `Flow ended at node "${nodeId}".`));
  }, [activeBot, pushMessage, safeEdges]);

  useEffect(() => {
    if (!isOpen) return;

    setMessages([]);
    setVariables({});
    variablesRef.current = {};
    stepCounterRef.current = 0;
    setCurrentNodeId(null);
    setCurrentBlockIndex(0);
    setPendingInput(null);
    setUserInput('');
    setValidationError(null);

    if (!activeBot) {
      pushMessage(createMessage('system', 'text', 'Preview error: no active bot found in editor state.'));
      return;
    }

    if (activeBot.nodes.length === 0) {
      pushMessage(createMessage('system', 'text', 'Add at least one node to run this preview.'));
      return;
    }

    const startNode = activeBot.nodes.find((node) => node.type === 'start') || activeBot.nodes[0];
    const firstEdge = safeEdges.find((edge) => edge.source === startNode.id);
    if (!firstEdge) {
      pushMessage(createMessage('system', 'text', 'Connect the start node to a group to run this preview.'));
      return;
    }

    void executeBlock(firstEdge.target, 0, {});
  }, [activeBot, executeBlock, isOpen, pushMessage, safeEdges]);

  const handleUserInput = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingInput || !currentNodeId) return;
    await submitInputValue(userInput);
  };

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

    if (selectedBranch && !branchEdge) {
      pushMessage(
        createMessage(
          'system',
          'text',
          `No branch edge connected for selected option "${selectedBranch.label}". Continuing sequentially.`
        )
      );
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

  const renderInlineInputActions = () => {
    if (!pendingInput) return null;

    if (pendingInput.type === 'file') {
      return (
        <div className="mt-3 space-y-2">
          {(pendingInput.fileSources || []).includes('device') ? (
            <>
              <input
                type="file"
                multiple={pendingInput.allowMultipleFiles}
                accept={pendingInput.acceptedFileTypes}
                onChange={(event) => {
                  const files = event.target.files;
                  if (!files || files.length === 0) return;
                  const fileNames = Array.from(files).map((file) => file.name).join(', ');
                  void submitInputValue(fileNames);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
              />
              <p className="text-[11px] text-slate-500">
                Allowed: {pendingInput.acceptedFileTypes || 'any'} | Max {pendingInput.maxFileSizeMb || 10}MB
              </p>
            </>
          ) : null}

          {(pendingInput.fileSources || []).includes('cloudLink') ? (
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={cloudFileLink}
                onChange={(event) => setCloudFileLink(event.target.value)}
                placeholder="Paste Google Drive / cloud file link"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none focus:border-orange-300"
              />
              <button
                type="button"
                onClick={() => void submitInputValue(cloudFileLink)}
                disabled={!cloudFileLink.trim()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 disabled:opacity-50"
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
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
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
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50"
                >
                  {method.label || method.value}
                </button>
              ))}
            </div>
          ) : null}
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
                className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:border-orange-300 hover:bg-orange-50"
              >
                {rating}
              </button>
            );
          })}
        </div>
      );
    }

    if ((pendingInput.type === 'buttons' || pendingInput.type === 'pic_choice' || pendingInput.type === 'cards')
      && pendingInput.options?.filter((option) => option.value.trim()).length) {
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {pendingInput.options.filter((option) => option.value.trim()).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => void submitInputValue(option.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50"
            >
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute top-0 right-0 z-[90] h-full w-[430px] border-l border-slate-200 bg-[#F7F8FC] shadow-[-16px_0_32px_rgba(15,23,42,0.08)] flex flex-col">
      <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Bot size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{activeBot?.name || 'Chatbot'}</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Preview</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-none'
                    : message.type === 'system'
                      ? 'bg-violet-50 text-violet-700 border border-violet-100'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}
              >
                {message.contentType === 'text' && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                {message.contentType === 'image' && (
                  <MediaCard
                    label="Image"
                    contentType="image"
                    content={message.content}
                    attachmentName={message.attachmentName}
                  />
                )}
                {message.contentType === 'video' && (
                  <MediaCard
                    label="Video"
                    contentType="video"
                    content={message.content}
                    attachmentName={message.attachmentName}
                  />
                )}
                {message.contentType === 'audio' && (
                  <MediaCard
                    label="Audio"
                    contentType="audio"
                    content={message.content}
                    attachmentName={message.attachmentName}
                  />
                )}
                {message.contentType === 'embed' && (
                  <MediaCard
                    label="Embed"
                    contentType="embed"
                    content={message.content}
                  />
                )}
              </div>
            </div>
          ))}

          {pendingInput && (
            <div className="flex justify-start">
              <div className="max-w-[92%] rounded-2xl rounded-tl-none border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-slate-800">{pendingInput.prompt}</p>
                <div className="mt-2 text-xs text-slate-500">
                  Saving as <span className="font-semibold text-slate-700">{pendingInput.variable}</span>
                </div>
                {renderInlineInputActions()}
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2 flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
      </div>

      <div className="border-t border-slate-100 bg-white p-4">
          {validationError && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {Object.keys(variables).length > 0 && (
            <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Sparkles size={12} />
                Captured variables
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700">{key}</span>
                    <span className="truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleUserInput} className="flex items-center gap-2">
            <input
              type={getInputType()}
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              placeholder={pendingInput?.placeholder || 'The flow will pause here when input is needed'}
              disabled={!pendingInput || !requiresManualTyping}
              className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            {pendingInput?.type === 'phone' ? (
              <span className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                {pendingInput.phoneCountryCode || '+91'}
              </span>
            ) : null}
            <button
              type="submit"
              disabled={!pendingInput || !requiresManualTyping || !userInput.trim()}
              className="min-w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-50 disabled:bg-slate-200"
            >
              {pendingInput?.buttonLabel ? (
                <span className="px-3 text-xs font-semibold">{pendingInput.buttonLabel}</span>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
      </div>
    </aside>
  );
}

const MediaCard = ({
  label,
  contentType,
  content,
  attachmentName,
}: {
  label: string;
  contentType: 'image' | 'video' | 'audio' | 'embed';
  content: string;
  attachmentName?: string;
}) => (
  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
    <div className="font-semibold text-slate-700">{label}</div>
    {contentType === 'image' ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={content} alt={attachmentName || 'Bubble image'} className="mt-2 max-h-56 w-full rounded-md object-cover" />
    ) : null}
    {contentType === 'video' ? (
      <video src={content} controls className="mt-2 max-h-56 w-full rounded-md" />
    ) : null}
    {contentType === 'audio' ? (
      <audio src={content} controls className="mt-2 w-full" />
    ) : null}
    {contentType === 'embed' ? <div className="mt-1 break-all">{content || 'No embed source provided.'}</div> : null}
    {contentType !== 'embed' && attachmentName ? <div className="mt-2 text-[11px]">{attachmentName}</div> : null}
    {!content && contentType !== 'embed' ? <div className="mt-1 break-all">{`No ${label.toLowerCase()} source provided.`}</div> : null}
  </div>
);
