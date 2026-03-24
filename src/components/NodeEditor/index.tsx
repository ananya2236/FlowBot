"use client";
import React, { useState, useEffect } from 'react';
import useStore from '@/lib/store';
import { nanoid } from 'nanoid';
import { Trash2, Plus, MessageSquare, MousePointer2, Settings, Trash, Info, Bot } from 'lucide-react';

const NodeEditor = () => {
  const { bots, activeBotId, setNodes } = useStore();
  const activeBot = bots.find(b => b.id === activeBotId);
  const nodes = activeBot?.nodes || [];
  
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    const node = nodes.find((n) => n.selected);
    setSelectedNode(node || null);
  }, [nodes]);

  const updateNodeData = (newData: any) => {
    if (selectedNode) {
      const newNodes = nodes.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...n.data, ...newData } };
        }
        return n;
      });
      setNodes(newNodes);
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateNodeData({ label: e.target.value });
  };

  const handleButtonLabelChange = (index: number, label: string) => {
    if (!selectedNode?.data?.buttons) return;
    const newButtons = [...selectedNode.data.buttons];
    newButtons[index] = { ...newButtons[index], label };
    updateNodeData({ buttons: newButtons });
  };

  const addButton = () => {
    if (!selectedNode) return;
    const newButtons = [...(selectedNode.data?.buttons || []), { id: nanoid(), label: 'New Button' }];
    updateNodeData({ buttons: newButtons });
  };

  const removeButton = (index: number) => {
    if (!selectedNode?.data?.buttons) return;
    const newButtons = selectedNode.data.buttons.filter((_: any, i: number) => i !== index);
    updateNodeData({ buttons: newButtons });
  };

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

  const isQuestion = selectedNode?.type === 'question' || selectedNode?.id?.includes('input') || false;

  return (
    <div className="p-6 h-full flex flex-col bg-zinc-950/50 backdrop-blur-md">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-2xl border ${isQuestion ? 'bg-accent/10 border-accent/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
            {isQuestion ? <MousePointer2 size={18} className="text-accent" strokeWidth={2.5} /> : <MessageSquare size={18} className="text-blue-400" strokeWidth={2.5} />}
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight uppercase">{selectedNode?.type || 'Block'}</h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Settings</p>
          </div>
        </div>
        <button 
          onClick={deleteNode}
          disabled={selectedNode?.id === 'start'}
          className="p-2.5 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-xl transition-all disabled:opacity-0 border border-transparent hover:border-red-500/20 shadow-lg"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-10 overflow-y-auto pr-2 scrollbar-hide">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            {isQuestion ? 'Question Text' : 'Message Content'}
            <Info size={10} className="text-zinc-800" />
          </label>
          <textarea
            value={selectedNode?.data?.label || ''}
            onChange={handleLabelChange}
            placeholder="Type your message here..."
            rows={5}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-sm font-bold text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/40 transition-all resize-none shadow-2xl placeholder:text-zinc-800 tracking-tight leading-relaxed"
          />
        </div>

        {isQuestion && (
          <div className="space-y-5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                Option Buttons
              </label>
              <button 
                onClick={addButton}
                disabled={(selectedNode?.data?.buttons?.length || 0) >= 3}
                className="text-[10px] font-black text-accent hover:text-accent/80 transition-all flex items-center gap-1.5 disabled:opacity-30 uppercase tracking-widest bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/10 hover:border-accent/30"
              >
                <Plus size={12} strokeWidth={3} /> Add Option
              </button>
            </div>
            
            <div className="space-y-3.5">
              {selectedNode?.data?.buttons?.map((button: any, index: number) => (
                <div key={button.id} className="group/btn relative">
                  <input
                    type="text"
                    value={button.label}
                    onChange={(e) => handleButtonLabelChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-xs font-black text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/40 transition-all pr-12 shadow-xl uppercase tracking-wider"
                  />
                  <button 
                    onClick={() => removeButton(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-red-500 opacity-0 group-hover/btn:opacity-100 transition-all"
                  >
                    <Trash size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {(!selectedNode?.data?.buttons || selectedNode.data.buttons.length === 0) && (
                <div className="py-10 border-2 border-dashed border-zinc-900 rounded-3xl text-center bg-zinc-900/20">
                  <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">No options defined</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 border-t border-zinc-900">
        <div className="p-5 bg-accent/5 border border-accent/10 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 -rotate-12 group-hover:scale-110 transition-transform">
            <Bot size={40} className="text-accent" />
          </div>
          <p className="text-[10px] text-accent/60 leading-relaxed font-black uppercase tracking-widest relative z-10">
            Auto-saved to Spinabot Cloud
          </p>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
