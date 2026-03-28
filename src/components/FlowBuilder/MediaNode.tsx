"use client";
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Image as ImageIcon, Video, Mic, Link as LinkIcon, Upload, Globe, MoreHorizontal } from 'lucide-react';

interface MediaNodeProps {
  data: {
    type: 'image' | 'video' | 'audio';
    url?: string;
    file?: File | null;
  };
  selected: boolean;
}

const MediaNode = ({ data, selected }: MediaNodeProps) => {
  const [url, setUrl] = useState(data.url || '');
  const [mode, setMode] = useState<'url' | 'upload'>(data.url ? 'url' : 'upload');

  const getIcon = () => {
    switch (data.type) {
      case 'image': return <ImageIcon size={14} className="text-purple-500" />;
      case 'video': return <Video size={14} className="text-blue-500" />;
      case 'audio': return <Mic size={14} className="text-green-500" />;
      default: return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      data.file = file;
      // In a real app, you'd upload this and get a URL
      setUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className={`node-card w-[280px] flex flex-col overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{data.type}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Toggle Mode */}
        <div className="flex bg-gray-50 p-0.5 rounded-lg border border-gray-100">
          <button 
            onClick={() => setMode('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all ${mode === 'upload' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Upload size={12} />
            Upload
          </button>
          <button 
            onClick={() => setMode('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium rounded-md transition-all ${mode === 'url' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LinkIcon size={12} />
            URL
          </button>
        </div>

        {mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group">
            <Upload size={20} className="text-gray-300 group-hover:text-orange-400 mb-2" />
            <span className="text-[11px] font-medium text-gray-400 group-hover:text-gray-600">Click to upload file</span>
            <input type="file" className="hidden" onChange={handleFileChange} accept={`${data.type}/*`} />
          </label>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg focus-within:border-orange-200 transition-colors shadow-sm">
              <Globe size={14} className="text-gray-300" />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  data.url = e.target.value;
                }}
                placeholder={`Paste ${data.type} URL...`}
                className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-gray-700 placeholder-gray-300 p-0"
              />
            </div>
          </div>
        )}

        {/* Preview Placeholder */}
        {url && (
          <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-2 flex items-center justify-center min-h-[100px] text-[11px] text-gray-400 font-medium italic">
            Preview will appear here
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!bg-white !border-gray-200" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-gray-200" />
    </div>
  );
};

export default MediaNode;
