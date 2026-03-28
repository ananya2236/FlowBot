"use client";
import React from 'react';
import {
  Type,
  Image as ImageIcon,
  Video,
  Mic,
  MessageSquare,
  Mail,
  Phone,
  Hash,
  Calendar,
  Search,
  MousePointer2,
  HelpCircle,
  LayoutGrid,
  Globe,
  File,
  Star,
  FileText,
  Clock,
  ChevronRight,
  Layout
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Bubbles',
    items: [
      { id: 'bubble', label: 'Text', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
      { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
      { id: 'video', label: 'Video', icon: Video, color: 'text-blue-500', bg: 'bg-blue-50' },
      { id: 'audio', label: 'Audio', icon: Mic, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { id: 'embed', label: 'Embed', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' },
    ]
  },
  {
    title: 'Inputs',
    items: [
      { id: 'input_text', label: 'Text', icon: Type, color: 'text-blue-500', bg: 'bg-blue-50' },
      { id: 'input_number', label: 'Number', icon: Hash, color: 'text-indigo-500', bg: 'bg-indigo-50' },
      { id: 'input_email', label: 'Email', icon: Mail, color: 'text-orange-500', bg: 'bg-orange-50' },
      { id: 'input_website', label: 'Website', icon: Globe, color: 'text-sky-500', bg: 'bg-sky-50' },
      { id: 'input_date', label: 'Date', icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { id: 'input_phone', label: 'Phone', icon: Phone, color: 'text-cyan-500', bg: 'bg-cyan-50' },
      { id: 'input_rating', label: 'Rating', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    ]
  },
  {
    title: 'Logic',
    items: [
      { id: 'logic_condition', label: 'Condition', icon: Layout, color: 'text-red-500', bg: 'bg-red-50' },
    ]
  }
];

export default function EditorSidebar() {
  const [search, setSearch] = React.useState('');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-[280px] bg-[#FAFAFA] border-r border-slate-200 flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-white">
        <div className="relative group">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search components..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-black placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        {SECTIONS.map((section) => {
          const filteredItems = section.items.filter(item => 
            item.label.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-3">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">{section.title}</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.id)}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-grab active:cursor-grabbing bg-white border border-slate-200/60 hover:border-orange-500/40 hover:bg-white hover:shadow-lg hover:shadow-orange-500/5 group transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-all duration-200">
                      <item.icon size={14} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-black transition-colors text-center tracking-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-50">
        <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <HelpCircle size={16} className="text-slate-400 group-hover:text-orange-500" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guide</span>
          </div>
          <ChevronRight size={14} className="text-slate-300" />
        </button>
      </div>
    </aside>
  );
}
