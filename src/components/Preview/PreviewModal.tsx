"use client";
import React, { useCallback, useEffect, useState } from 'react';
import { X, Send, Bot, AlertCircle } from 'lucide-react';
import useStore from '@/lib/store';
import {
  BubbleBlock,
  GroupNodeData,
  InputBlock,
  findBlockEdge,
  migrateToBlocks,
  validateInputBlock,
} from '@/lib/blocks';

interface Message {
  id: string;
  type: 'bot' | 'user' | 'system';
  contentType: 'text' | 'image' | 'video' | 'audio' | 'embed';
  content: string;
}

function createMessage(type: Message['type'], contentType: Message['contentType'], content: string): Message {
  return {
    id: Math.random().toString(36).slice(2, 11),
    type,
    contentType,
    content,
  };
}

export default function PreviewModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { bots, activeBotId } = useStore();
  const activeBot = bots.find((bot) => bot.id === activeBotId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [pendingInput, setPendingInput] = useState<InputBlock | null>(null);
  const [userInput, setUserInput] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const runNode = useCallback(async function executeNode(nodeId: string, startIndex: number) {
    const node = activeBot?.nodes.find((item) => item.id === nodeId);
    if (!node) return;

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
        await new Promise((resolve) => setTimeout(resolve, 450));
        setMessages((previous) => [...previous, createMessage('bot', bubble.type, bubble.content)]);
        setIsTyping(false);

        const nextEdge = findBlockEdge(activeBot?.edges || [], nodeId, bubble.id);
        if (nextEdge) {
          await executeNode(nextEdge.target, 0);
          return;
        }

        continue;
      }

      setPendingInput(block as InputBlock);
      setCurrentBlockIndex(index);
      return;
    }

    const fallbackEdge = findBlockEdge(activeBot?.edges || [], nodeId, null);
    if (fallbackEdge) {
      await executeNode(fallbackEdge.target, 0);
      return;
    }

    setCurrentNodeId(null);
    setPendingInput(null);
  }, [activeBot]);

  useEffect(() => {
    if (!isOpen || !activeBot || activeBot.nodes.length === 0) return;

    const startNode = activeBot.nodes.find((node) => node.type === 'start') || activeBot.nodes[0];
    const firstEdge = activeBot.edges.find((edge) => edge.source === startNode.id);

    setMessages([]);
    setVariables({});
    setCurrentNodeId(null);
    setCurrentBlockIndex(0);
    setPendingInput(null);
    setUserInput('');
    setValidationError(null);

    if (firstEdge) {
      void runNode(firstEdge.target, 0);
    }
  }, [activeBot, isOpen, runNode]);

  const handleUserInput = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingInput || !currentNodeId) return;

    const error = validateInputBlock(pendingInput, userInput);
    if (error) {
      setValidationError(error);
      return;
    }

    const value = userInput.trim();
    setValidationError(null);
    setVariables((previous) => ({ ...previous, [pendingInput.variable]: value }));
    setMessages((previous) => [...previous, createMessage('user', 'text', value)]);
    setUserInput('');

    const edge = findBlockEdge(activeBot?.edges || [], currentNodeId, pendingInput.id);
    if (edge) {
      setPendingInput(null);
      await runNode(edge.target, 0);
      return;
    }

    setPendingInput(null);
    await runNode(currentNodeId, currentBlockIndex + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#FAFAFA] w-full max-w-[420px] h-[680px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border-[8px] border-white relative mx-4">
        <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-orange-500 text-white rounded-tr-none'
                    : message.type === 'system'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}
              >
                {message.contentType === 'text' && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                {message.contentType === 'image' && <MediaCard label="Image" content={message.content} />}
                {message.contentType === 'video' && <MediaCard label="Video" content={message.content} />}
                {message.contentType === 'audio' && <MediaCard label="Audio" content={message.content} />}
                {message.contentType === 'embed' && <MediaCard label="Embed" content={message.content} />}
              </div>
            </div>
          ))}

          {pendingInput && (
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-2xl rounded-tl-none border border-slate-100 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-slate-800">{pendingInput.prompt}</p>
                <div className="mt-2 text-xs text-slate-500">
                  Saving as <span className="font-semibold text-slate-700">{pendingInput.variable}</span>
                </div>
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

        <div className="border-t border-slate-100 bg-white p-5">
          {validationError && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {Object.keys(variables).length > 0 && (
            <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
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
              type={pendingInput?.type === 'number' ? 'number' : pendingInput?.type === 'date' ? 'date' : 'text'}
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              placeholder={pendingInput?.placeholder || 'Type a message...'}
              disabled={!pendingInput}
              className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!pendingInput || !userInput.trim()}
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
      </div>
    </div>
  );
}

const MediaCard = ({ label, content }: { label: string; content: string }) => (
  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
    <div className="font-semibold text-slate-700">{label}</div>
    <div className="mt-1 break-all">{content || `No ${label.toLowerCase()} source provided.`}</div>
  </div>
);
