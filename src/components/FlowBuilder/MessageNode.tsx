"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, MoreHorizontal } from 'lucide-react';

const MessageNode = ({ data, selected }: { data: any, selected: boolean }) => {
  return (
    <div className={`group min-w-[220px] bg-zinc-900 border-2 rounded-2xl transition-all duration-300 shadow-2xl ${
      selected ? 'border-accent ring-4 ring-accent/20 scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent/10 rounded-lg border border-accent/20">
            <MessageSquare size={14} className="text-accent" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bubble</span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-zinc-600 hover:text-white border border-transparent hover:border-zinc-700">
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      <div className="p-5">
        <div className="text-sm text-zinc-300 leading-relaxed font-bold tracking-tight">
          {data.label || 'Enter message content...'}
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-zinc-800 !border-2 !border-zinc-900 hover:!bg-accent transition-all duration-300" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-zinc-800 !border-2 !border-zinc-900 hover:!bg-accent transition-all duration-300" 
      />
    </div>
  );
};

export default MessageNode;
