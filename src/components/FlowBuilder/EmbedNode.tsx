"use client";
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, Link as LinkIcon, Globe, File, MoreHorizontal, ChevronDown } from 'lucide-react';

interface EmbedNodeProps {
  data: {
    type?: 'pdf' | 'iframe' | 'link';
    url?: string;
  };
  selected: boolean;
}

const EMBED_TYPES = [
  { id: 'link', label: 'Website Link', icon: LinkIcon },
  { id: 'pdf', label: 'PDF Document', icon: FileText },
  { id: 'iframe', label: 'iFrame Embed', icon: Globe },
];

const EmbedNode = ({ data, selected }: EmbedNodeProps) => {
  const [type, setType] = useState(data.type || 'link');
  const [url, setUrl] = useState(data.url || '');
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const currentType = EMBED_TYPES.find(t => t.id === type) || EMBED_TYPES[0];

  return (
    <div className={`node-card w-[280px] flex flex-col overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <currentType.icon size={14} className="text-gray-500" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Embed</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-4">
        {/* Type Selector */}
        <div className="relative">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Embed Type</label>
          <button 
            onClick={() => setShowTypeMenu(!showTypeMenu)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <currentType.icon size={14} className="text-gray-400" />
              <span className="text-[13px] text-gray-700">{currentType.label}</span>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {showTypeMenu && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {EMBED_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id as any);
                    data.type = t.id as any;
                    setShowTypeMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${type === t.id ? 'text-orange-500 bg-orange-50/50' : 'text-gray-600'}`}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resource URL</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg focus-within:border-orange-200 transition-colors shadow-sm">
            <Globe size={14} className="text-gray-300" />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                data.url = e.target.value;
              }}
              placeholder={`Paste ${type} URL...`}
              className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-gray-700 placeholder-gray-300 p-0"
            />
          </div>
        </div>

        {/* Status indicator */}
        {url && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-green-50 rounded-lg border border-green-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-green-600">Resource linked successfully</span>
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-white !border-gray-200" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-gray-200" />
    </div>
  );
};

export default EmbedNode;
