"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Link as LinkIcon, 
  Plus, 
  X, 
  MoreHorizontal, 
  Upload, 
  Globe, 
  FileText,
  MousePointer2
} from 'lucide-react';

interface Block {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'embed' | 'input';
  content: string;
  meta?: any;
}

interface BubbleNodeProps {
  data: {
    blocks: Block[];
    onUpdate?: (blocks: Block[]) => void;
  };
  selected: boolean;
}

const BubbleNode = ({ data, selected }: BubbleNodeProps) => {
  const [blocks, setBlocks] = useState<Block[]>(data.blocks || [
    { id: '1', type: 'text', content: 'Hello! How can I help you today?' }
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    if (data.onUpdate) {
      data.onUpdate(blocks);
    }
    data.blocks = blocks;
  }, [blocks]);

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: '',
      meta: type === 'input' ? { inputType: 'text', placeholder: 'Type your response...', variable: 'user_response' } : {}
    };
    setBlocks([...blocks, newBlock]);
    setShowAddMenu(false);
  };

  const updateBlock = (id: string, content: string, meta?: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, meta: meta || b.meta } : b));
  };

  const removeBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  return (
    <div className={`node-container w-[320px] overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Node Header */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center">
            <MessageSquare size={12} className="text-orange-600" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Message Bubble</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Blocks Container */}
      <div className="flex flex-col">
        {blocks.map((block) => (
          <div key={block.id} className="node-block group">
            <BlockRenderer 
              block={block} 
              onUpdate={(content, meta) => updateBlock(block.id, content, meta)} 
            />
            {blocks.length > 1 && (
              <button 
                onClick={() => removeBlock(block.id)}
                className="absolute right-2 top-2 p-1 bg-white rounded-md border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Node Footer / Add Menu */}
      <div className="p-2 bg-slate-50/30 border-t border-slate-50">
        {showAddMenu ? (
          <div className="grid grid-cols-3 gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <MenuButton icon={Plus} label="Text" onClick={() => addBlock('text')} />
            <MenuButton icon={ImageIcon} label="Image" onClick={() => addBlock('image')} />
            <MenuButton icon={Video} label="Video" onClick={() => addBlock('video')} />
            <MenuButton icon={Mic} label="Audio" onClick={() => addBlock('audio')} />
            <MenuButton icon={FileText} label="Embed" onClick={() => addBlock('embed')} />
            <MenuButton icon={MousePointer2} label="Input" onClick={() => addBlock('input')} />
          </div>
        ) : (
          <button 
            onClick={() => setShowAddMenu(true)}
            className="w-full py-1.5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
          >
            <Plus size={12} />
            Add Content Block
          </button>
        )}
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2" />
    </div>
  );
};

const BlockRenderer = ({ block, onUpdate }: { block: Block, onUpdate: (content: string, meta?: any) => void }) => {
  switch (block.type) {
    case 'text':
      return (
        <textarea
          value={block.content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Type your message..."
          className="minimal-input resize-none h-auto min-h-[20px] leading-relaxed"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
          rows={1}
          autoFocus={block.content === ''}
        />
      );
    
    case 'image':
    case 'video':
    case 'audio':
      return <MediaBlock type={block.type} content={block.content} onUpdate={onUpdate} />;

    case 'embed':
      return <EmbedBlock content={block.content} meta={block.meta} onUpdate={onUpdate} />;

    case 'input':
      return <EmbeddedInputBlock meta={block.meta} onUpdate={(meta) => onUpdate(block.content, meta)} />;

    default:
      return null;
  }
};

const MediaBlock = ({ type, content, onUpdate }: { type: string, content: string, onUpdate: (c: string) => void }) => {
  const [mode, setMode] = useState<'url' | 'upload'>(content ? 'url' : 'upload');
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex bg-slate-100 p-0.5 rounded-md">
          <button 
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm transition-all ${mode === 'upload' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}
          >Upload</button>
          <button 
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm transition-all ${mode === 'url' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}
          >URL</button>
        </div>
      </div>
      
      {mode === 'upload' ? (
        <div className="border-2 border-dashed border-slate-100 rounded-lg p-4 flex flex-col items-center justify-center hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer">
          <Upload size={16} className="text-slate-300 mb-1" />
          <span className="text-[10px] text-slate-400">Click to upload {type}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-100 rounded-md">
          <Globe size={12} className="text-slate-300" />
          <input 
            type="text" 
            value={content}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder={`Paste ${type} URL...`}
            className="minimal-input text-xs"
          />
        </div>
      )}
    </div>
  );
};

const EmbedBlock = ({ content, meta, onUpdate }: { content: string, meta: any, onUpdate: (c: string, m?: any) => void }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-white border border-slate-100 rounded-md">
        <FileText size={12} className="text-slate-300" />
        <input 
          type="text" 
          value={content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Paste PDF, iFrame, or Website URL..."
          className="minimal-input text-xs"
        />
      </div>
      <p className="text-[9px] text-slate-400 px-1 italic">Supports PDF, iframe, and website embeds</p>
    </div>
  );
};

const EmbeddedInputBlock = ({ meta, onUpdate }: { meta: any, onUpdate: (m: any) => void }) => {
  return (
    <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100/50 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Embedded Input</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono text-orange-500">#</span>
          <input 
            type="text" 
            value={meta.variable}
            onChange={(e) => onUpdate({ ...meta, variable: e.target.value })}
            className="bg-transparent border-none p-0 text-[9px] font-mono text-slate-600 focus:ring-0 w-20"
          />
        </div>
      </div>
      <input 
        type="text" 
        value={meta.placeholder}
        onChange={(e) => onUpdate({ ...meta, placeholder: e.target.value })}
        className="w-full bg-white border border-slate-100 rounded-md px-2 py-1 text-[11px] text-slate-500"
      />
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1 p-2 hover:bg-white rounded-md border border-transparent hover:border-slate-100 transition-all group"
  >
    <Icon size={12} className="text-slate-400 group-hover:text-orange-500" />
    <span className="text-[8px] font-bold uppercase text-slate-400 group-hover:text-slate-600">{label}</span>
  </button>
);

export default BubbleNode;
