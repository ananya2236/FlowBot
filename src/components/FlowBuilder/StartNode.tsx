"use client";
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Flag } from 'lucide-react';

const StartNode = ({ selected }: { selected: boolean }) => {
  return (
    <div
      className={`typebot-start ${selected ? 'selected' : ''}`}
      role="button"
      aria-label="Start node"
      tabIndex={0}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Flag size={15} className="text-gray-500" />
        <span className="text-[13px] font-medium text-gray-700">Start</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!-right-[6px]"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

export default StartNode;
