"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

const StartNode = ({ selected }: { selected: boolean }) => {
  return (
    <div className={`group-node px-6 py-4 flex items-center gap-4 min-w-[180px] ${selected ? 'selected' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
        <Play size={20} className="text-white fill-white ml-1" />
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-bold text-black">Start</span>
        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Flow Entry</span>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white !-right-[6px] !top-1/2 -translate-y-1/2" 
      />
    </div>
  );
};

export default StartNode;
