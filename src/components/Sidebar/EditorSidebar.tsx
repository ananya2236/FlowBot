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
  Zap,
  GitBranch,
  Globe,
  Database,
  Webhook
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Bubbles',
    items: [
      { id: 'text', label: 'Text', icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-400/10' },
      { id: 'video', label: 'Video', icon: Video, color: 'text-pink-400', bg: 'bg-pink-400/10' },
      { id: 'audio', label: 'Audio', icon: Mic, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    ]
  },
  {
    title: 'Inputs',
    items: [
      { id: 'text_input', label: 'Text', icon: Type, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
      { id: 'email', label: 'Email', icon: Mail, color: 'text-orange-400', bg: 'bg-orange-400/10' },
      { id: 'phone', label: 'Phone', icon: Phone, color: 'text-sky-400', bg: 'bg-sky-400/10' },
      { id: 'number', label: 'Number', icon: Hash, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
      { id: 'date', label: 'Date', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-400/10' },
      { id: 'buttons', label: 'Buttons', icon: MousePointer2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    ]
  },
  {
    title: 'Logic',
    items: [
      { id: 'condition', label: 'Condition', icon: GitBranch, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
      { id: 'redirect', label: 'Redirect', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      { id: 'webhook', label: 'Webhook', icon: Webhook, color: 'text-red-400', bg: 'bg-red-400/10' },
    ]
  },
  {
    title: 'Events',
    items: [
      { id: 'trigger', label: 'Trigger', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    ]
  },
  {
    title: 'Integrations',
    items: [
      { id: 'google_sheets', label: 'Sheets', icon: Database, color: 'text-green-400', bg: 'bg-green-400/10' },
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
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-[calc(100vh-3.5rem)] sticky left-0 z-40">
      <div className="p-4">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search blocks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/40 transition-all placeholder:text-zinc-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4 ml-1">{section.title}</h3>
            <div className="grid grid-cols-2 gap-2">
              {section.items
                .filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
                .map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.id)}
                    className="flex flex-col items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-accent/30 hover:scale-[1.02] transition-all cursor-grab active:cursor-grabbing group shadow-lg active:scale-[0.98]"
                  >
                    <div className={`p-2 rounded-xl ${item.bg} group-hover:scale-110 transition-transform border border-transparent group-hover:border-white/5`}>
                      <item.icon size={16} className={item.color} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-tighter">{item.label}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all group border border-transparent hover:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors">
              <HelpCircle size={14} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Help & Guide</span>
          </div>
          <LayoutGrid size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
        </button>
      </div>
    </aside>
  );
}
