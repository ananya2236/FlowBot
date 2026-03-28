"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

const StartNode = ({ selected }: { selected: boolean }) => {
  return (
    <div className={`typebot-group px-5 py-3.5 flex items-center gap-3 min-w-[160px] ${selected ? 'selected' : ''}`}>
      <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200/50">
        <Play size={18} className="text-white fill-white ml-0.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-gray-800">Start</span>
        <span className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Flow Entry</span>
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
