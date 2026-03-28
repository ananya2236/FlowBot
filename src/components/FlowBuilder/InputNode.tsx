"use client";
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Type, 
  Hash, 
  Mail, 
  Globe, 
  Calendar, 
  Clock, 
  Phone, 
  Star, 
  File, 
  CreditCard, 
  MousePointer2,
  ChevronDown,
  Settings2,
  Paperclip,
  Mic,
  Layout
} from 'lucide-react';

interface InputNodeProps {
  data: {
    type: string;
    label: string;
    variable: string;
    placeholder: string;
    options?: any;
  };
  selected: boolean;
}

const INPUT_CONFIG = {
  text: { label: 'Text Input', icon: Type, color: 'text-blue-500', bg: 'bg-blue-50' },
  number: { label: 'Number Input', icon: Hash, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  email: { label: 'Email Address', icon: Mail, color: 'text-orange-500', bg: 'bg-orange-50' },
  website: { label: 'Website/URL', icon: Globe, color: 'text-sky-500', bg: 'bg-sky-50' },
  date: { label: 'Date Picker', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  time: { label: 'Time Picker', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' },
  phone: { label: 'Phone Number', icon: Phone, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  rating: { label: 'Rating Scale', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  file: { label: 'File Upload', icon: File, color: 'text-purple-500', bg: 'bg-purple-50' },
  cards: { label: 'Card Choice', icon: Layout, color: 'text-violet-500', bg: 'bg-violet-50' },
  buttons: { label: 'Button Choice', icon: MousePointer2, color: 'text-pink-500', bg: 'bg-pink-50' },
};

const InputNode = ({ data, selected }: InputNodeProps) => {
  const config = INPUT_CONFIG[data.type as keyof typeof INPUT_CONFIG] || INPUT_CONFIG.text;
  const [variable, setVariable] = useState(data.variable || 'user_input');
  const [placeholder, setPlaceholder] = useState(data.placeholder || 'Type your answer...');
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className={`node-container w-[300px] overflow-hidden ${selected ? 'selected' : ''}`}>
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md ${config.bg} flex items-center justify-center`}>
            <config.icon size={12} className={config.color} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{config.label}</span>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1 rounded-md transition-colors ${showConfig ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings2 size={14} />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Variable Mapping */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Store response in</label>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl group focus-within:border-orange-200 focus-within:bg-white transition-all">
            <span className="text-orange-500 font-mono text-xs font-bold">#</span>
            <input 
              type="text" 
              value={variable}
              onChange={(e) => {
                setVariable(e.target.value);
                data.variable = e.target.value;
              }}
              placeholder="variable_name"
              className="minimal-input font-mono text-xs font-medium"
            />
          </div>
        </div>

        {/* Input Preview / Placeholder Edit */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Input Placeholder</label>
          <div className="px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm focus-within:border-orange-200 transition-all">
            <input 
              type="text" 
              value={placeholder}
              onChange={(e) => {
                setPlaceholder(e.target.value);
                data.placeholder = e.target.value;
              }}
              placeholder="Type your message..."
              className="minimal-input text-xs"
            />
          </div>
        </div>

        {/* Dynamic Config Sections */}
        {showConfig && (
          <div className="pt-3 border-t border-slate-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
              <div className="flex items-center gap-2">
                <Paperclip size={12} className="text-slate-400 group-hover:text-slate-600" />
                <span className="text-[11px] font-medium text-slate-600">Allow attachments</span>
              </div>
              <div className="w-6 h-3 bg-slate-200 rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group">
              <div className="flex items-center gap-2">
                <Mic size={12} className="text-slate-400 group-hover:text-slate-600" />
                <span className="text-[11px] font-medium text-slate-600">Voice response</span>
              </div>
              <div className="w-6 h-3 bg-slate-200 rounded-full relative">
                <div className="absolute left-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-2.5 !h-2.5 !bg-white !border-slate-200" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-2.5 !h-2.5 !bg-white !border-slate-200" 
      />
    </div>
  );
};

export default InputNode;
