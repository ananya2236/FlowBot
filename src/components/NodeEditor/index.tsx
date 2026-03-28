"use client";
import React, { useState, useEffect } from 'react';
import useStore from '@/lib/store';
import { Trash2, Settings, Info, Bot, Layers, GripVertical } from 'lucide-react';

const NodeEditor = () => {
  const { bots, activeBotId, setNodes } = useStore();
  const activeBot = bots.find(b => b.id === activeBotId);
  const nodes = activeBot?.nodes || [];

  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    const node = nodes.find((n) => n.selected);
    setSelectedNode(node || null);
  }, [nodes]);

  const deleteNode = () => {
    if (selectedNode && selectedNode.id !== 'start') {
      const newNodes = nodes.filter((n) => n.id !== selectedNode.id);
      setNodes(newNodes);
      setSelectedNode(null);
    }
  };

  if (!selectedNode) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full dotted-bg">
        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl relative">
          <div className="absolute inset-0 bg-accent/5 blur-2xl rounded-full" />
          <Settings size={32} className="text-zinc-700 animate-spin-slow relative z-10" />
        </div>
        <h3 className="text-[10px] font-black text-white mb-3 uppercase tracking-[0.3em] ml-[0.3em]">Editor Panel</h3>
        <p className="text-[11px] font-bold text-zinc-600 max-w-[200px] leading-relaxed uppercase tracking-tight">
          Select a block on the canvas to configure its logic.
        </p>
      </div>
    );
  }

  const isGroup = selectedNode.type === 'group';
  const isStart = selectedNode.id === 'start';
  const blocks = selectedNode.data?.blocks || [];
  const bubbleCount = blocks.filter((b: any) => b.kind === 'bubble').length;
  const inputCount = blocks.filter((b: any) => b.kind === 'input').length;

  return (
    <div className="p-6 h-full flex flex-col bg-zinc-950/50 backdrop-blur-md">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl border bg-blue-500/10 border-blue-500/20">
            <Layers size={18} className="text-blue-400" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight uppercase">
              {isStart ? 'Start' : selectedNode.data?.title || 'Group'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">
              {isStart ? 'Flow Entry' : 'Group Settings'}
            </p>
          </div>
        </div>
        {!isStart && (
          <button
            onClick={deleteNode}
            className="p-2.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/20 shadow-lg"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
        {isStart && (
          <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              This is the entry point of your flow. Connect it to your first group to begin the conversation.
            </p>
          </div>
        )}

        {isGroup && (
          <>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                Group Info
                <Info size={10} className="text-zinc-800" />
              </label>
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-600 font-bold uppercase tracking-wider">Blocks</span>
                  <span className="text-zinc-400 font-bold">{blocks.length}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-600 font-bold uppercase tracking-wider">Bubbles</span>
                  <span className="text-blue-400 font-bold">{bubbleCount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-600 font-bold uppercase tracking-wider">Inputs</span>
                  <span className="text-orange-400 font-bold">{inputCount}</span>
                </div>
              </div>
            </div>

            {blocks.length > 0 && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">
                  Block Order
                </label>
                <div className="space-y-1">
                  {blocks.map((block: any, i: number) => (
                    <div key={block.id} className="flex items-center gap-2 p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
                      <span className="text-[10px] text-zinc-600 font-mono w-4">{i + 1}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${block.kind === 'bubble' ? 'bg-blue-400' : 'bg-orange-400'}`} />
                      <span className="text-[11px] text-zinc-400 font-medium flex-1 truncate">
                        {block.kind === 'input' ? `${block.type} input` : block.type}
                      </span>
                      <GripVertical size={12} className="text-zinc-700" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="pt-8 border-t border-zinc-900">
        <div className="p-5 bg-accent/5 border border-accent/10 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 -rotate-12 group-hover:scale-110 transition-transform">
            <Bot size={40} className="text-accent" />
          </div>
          <p className="text-[10px] text-accent/60 leading-relaxed font-black uppercase tracking-widest relative z-10">
            Edit blocks inline on the canvas
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
