"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { MousePointer2, MoreHorizontal } from 'lucide-react';

const QuestionNode = ({ data, selected }: { data: any, selected: boolean }) => {
  return (
    <div className={`group min-w-[220px] bg-zinc-900 border-2 rounded-2xl transition-all duration-300 shadow-2xl ${
      selected ? 'border-accent ring-4 ring-accent/20 scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'
    }`}>
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent/10 rounded-lg border border-accent/20">
            <MousePointer2 size={14} className="text-accent" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Input</span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-zinc-600 hover:text-white border border-transparent hover:border-zinc-700">
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      <div className="p-5 space-y-5">
        <div className="text-sm text-zinc-300 font-bold leading-relaxed tracking-tight">
          {data.label || 'Enter question text...'}
        </div>
        
        <div className="space-y-2.5">
          {data.buttons?.map((button: any, index: number) => (
            <div key={button.id || index} className="relative flex items-center bg-zinc-950 border border-zinc-800 p-3 rounded-xl group/btn hover:border-accent/50 transition-all shadow-inner">
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider flex-1 px-1">{button.label || `Option ${index + 1}`}</span>
              <Handle 
                type="source" 
                position={Position.Right} 
                id={button.id}
                className="!-right-4 !w-3 !h-3 !bg-zinc-800 !border-2 !border-zinc-900 hover:!bg-accent transition-all duration-300" 
              />
            </div>
          ))}
          {(!data.buttons || data.buttons.length === 0) && (
            <div className="text-[10px] text-zinc-700 font-black uppercase tracking-widest text-center py-4 border-2 border-dashed border-zinc-800 rounded-2xl">
              No options
            </div>
          )}
        </div>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-3 !h-3 !bg-zinc-800 !border-2 !border-zinc-900 hover:!bg-accent transition-all duration-300" 
      />
      {(!data.buttons || data.buttons.length === 0) && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-3 !h-3 !bg-zinc-800 !border-2 !border-zinc-900 hover:!bg-accent transition-all duration-300" 
        />
      )}
    </div>
  );
};

export default QuestionNode;
