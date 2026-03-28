"use client";
import React, { useState, useEffect } from 'react';
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
  MousePointer2,
  Hash,
  Mail,
  Calendar,
  Clock,
  Phone,
  Star,
  File,
  Layout,
  ChevronDown,
  Paperclip,
  Settings2,
  Type as TypeIcon
} from 'lucide-react';

const Type = ({ className, size }: { className?: string; size?: number }) => <TypeIcon className={className} size={size} />;

export interface Bubble {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'embed';
  content: string;
  meta?: any;
}

export interface InputConfig {
  id: string; // Add ID for multiple inputs
  type: string;
  variable: string;
  placeholder: string;
  attachments?: boolean;
  audio?: boolean;
}

export interface GroupNodeData {
  title: string;
  bubbles: Bubble[];
  inputs?: InputConfig[]; // Changed to array
  onUpdate?: (data: Partial<GroupNodeData>) => void;
}

const INPUT_TYPES = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'number', label: 'Number', icon: Hash },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'date', label: 'Date', icon: Calendar },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'file', label: 'File', icon: File },
];

const GroupNode = ({ data, selected }: { data: GroupNodeData; selected: boolean }) => {
  const [title, setTitle] = useState(data.title || 'Group #1');
  const [bubbles, setBubbles] = useState<Bubble[]>(data.bubbles || []);
  const [inputs, setInputs] = useState<InputConfig[]>(data.inputs || []);

  useEffect(() => {
    if (data.onUpdate) {
      data.onUpdate({ title, bubbles, inputs });
    }
  }, [title, bubbles, inputs]);

  const addBubble = (type: Bubble['type']) => {
    const newBubble: Bubble = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'text' ? 'New Message' : '',
    };
    setBubbles([...bubbles, newBubble]);
  };

  const updateBubble = (id: string, content: string) => {
    setBubbles(bubbles.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBubble = (id: string) => {
    setBubbles(bubbles.filter(b => b.id !== id));
  };

  const addInput = (type: string) => {
    const newInput: InputConfig = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      variable: `user_${type}_${inputs.length + 1}`,
      placeholder: `Enter ${type}...`,
    };
    setInputs([...inputs, newInput]);
  };

  const updateInput = (id: string, updates: Partial<InputConfig>) => {
    setInputs(inputs.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const removeInput = (id: string) => {
    setInputs(inputs.filter(i => i.id !== id));
  };

  return (
    <div className={`group-node w-[240px] overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Main target handle (Input dot on the left) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="main-target"
        className="!-left-[6px] !top-1/2 -translate-y-1/2" 
      />

      {/* Group Header */}
      <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between group/header">
        <div className="flex flex-col gap-0.5">
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-none p-0 text-[10px] font-bold uppercase tracking-widest text-slate-400 focus:ring-0 w-full focus:text-black transition-colors"
          />
          <div className="flex items-center gap-1">
            <button 
              onClick={() => addBubble('text')}
              className="p-1 hover:bg-orange-50 rounded text-slate-400 hover:text-orange-500 transition-colors"
              title="Add Bubble"
            >
              <Plus size={10} />
            </button>
            <button 
              onClick={() => addInput('text')}
              className="p-1 hover:bg-orange-50 rounded text-slate-400 hover:text-orange-500 transition-colors"
              title="Add Input"
            >
              <MousePointer2 size={10} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <button className="text-slate-300 hover:text-orange-500"><MoreHorizontal size={14} /></button>
        </div>
      </div>

      {/* Bubbles Section */}
      <div className="flex flex-col relative">
        {bubbles.map((bubble) => (
          <div key={bubble.id} className="bubble-item group/bubble border-b border-slate-50 last:border-b-0">
            <BubbleRenderer bubble={bubble} onUpdate={(c) => updateBubble(bubble.id, c)} />
            <button 
              onClick={() => removeBubble(bubble.id)}
              className="absolute right-2 top-2 p-1 bg-white rounded-md border border-slate-100 shadow-sm opacity-0 group-hover/bubble:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Inputs Section */}
      {inputs.map((input) => (
        <div key={input.id} className="p-3 bg-orange-50/10 border-t border-orange-100/30 space-y-2 relative group/input">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-100 flex items-center justify-center">
                <MousePointer2 size={8} className="text-orange-600" />
              </div>
              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">{input.type}</span>
            </div>
            <button 
              onClick={() => removeInput(input.id)}
              className="text-orange-300 hover:text-orange-500 opacity-0 group-hover/input:opacity-100 transition-all"
            >
              <X size={10} />
            </button>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-1.5 py-1 bg-white border border-orange-100/50 rounded-lg">
              <span className="text-orange-400 font-mono text-[9px] font-bold">#</span>
              <input 
                value={input.variable}
                onChange={(e) => updateInput(input.id, { variable: e.target.value })}
                className="inline-editable font-mono text-[10px] !text-orange-600"
                placeholder="var"
              />
            </div>
            <input 
              value={input.placeholder}
              onChange={(e) => updateInput(input.id, { placeholder: e.target.value })}
              className="w-full bg-white border border-orange-100/50 rounded-lg px-1.5 py-1 text-[10px] text-slate-600 placeholder:text-orange-200 focus:ring-1 focus:ring-orange-200 outline-none font-medium"
              placeholder="Placeholder..."
            />
          </div>
          {/* Individual handle for this input block (Output dot on the right) */}
          <Handle 
            type="source" 
            position={Position.Right} 
            id={`handle-${input.id}`}
            className="!-right-[6px] !top-1/2 -translate-y-1/2" 
          />
        </div>
      ))}

      {/* Main source handle if no inputs exist */}
      {inputs.length === 0 && (
        <Handle 
          type="source" 
          position={Position.Right} 
          id="main-source"
          className="!-right-[6px] !top-1/2 -translate-y-1/2" 
        />
      )}
    </div>
  );
};

const BubbleRenderer = ({ bubble, onUpdate }: { bubble: Bubble; onUpdate: (c: string) => void }) => {
  switch (bubble.type) {
    case 'text':
      return (
        <textarea
          value={bubble.content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Type message..."
          className="inline-editable resize-none min-h-[20px]"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
          rows={1}
        />
      );
    case 'image':
    case 'video':
    case 'audio':
      return <MediaBubble type={bubble.type} content={bubble.content} onUpdate={onUpdate} />;
    case 'embed':
      return <EmbedBubble content={bubble.content} onUpdate={onUpdate} />;
    default:
      return null;
  }
};

const MediaBubble = ({ type, content, onUpdate }: { type: string; content: string; onUpdate: (c: string) => void }) => {
  const [mode, setMode] = useState<'url' | 'upload'>(content ? 'url' : 'upload');
  return (
    <div className="space-y-2">
      <div className="flex bg-slate-100 p-0.5 rounded-md w-fit">
        <button onClick={() => setMode('upload')} className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-all ${mode === 'upload' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>Upload</button>
        <button onClick={() => setMode('url')} className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-sm transition-all ${mode === 'url' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400'}`}>URL</button>
      </div>
      {mode === 'upload' ? (
        <div className="border border-dashed border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center hover:bg-slate-50 transition-all cursor-pointer">
          <Upload size={14} className="text-slate-300 mb-1" />
          <span className="text-[9px] text-slate-400">Upload {type}</span>
        </div>
      ) : (
        <input 
          value={content}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder={`Paste ${type} URL...`}
          className="w-full bg-white border border-slate-100 rounded-md px-2 py-1 text-[11px] text-slate-600"
        />
      )}
    </div>
  );
};

const EmbedBubble = ({ content, onUpdate }: { content: string; onUpdate: (c: string) => void }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-100 rounded-md">
      <FileText size={12} className="text-slate-300" />
      <input 
        value={content}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="PDF, iFrame, or Website URL..."
        className="inline-editable text-[11px]"
      />
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-100 text-slate-400 hover:text-orange-500 transition-all group"
  >
    <Icon size={12} className="group-hover:text-orange-500" />
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default GroupNode;
