"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Play, Send, Layout, Palette, Settings, Share2, Bot } from 'lucide-react';
import useStore from '@/lib/store';
import PreviewModal from '../Preview/PreviewModal';

interface EditorNavbarProps {
  botId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EditorNavbar({ botId, activeTab, setActiveTab }: EditorNavbarProps) {
  const router = useRouter();
  const { bots, renameBot } = useStore();
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const bot = bots.find((b) => b.id === botId);

  if (!bot) return null;

  return (
    <>
      <nav className="h-[56px] border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-900 group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Bot size={18} className="text-orange-600" />
            </div>
            <input 
              type="text" 
              value={bot.name || ''}
              onChange={(e) => renameBot(botId, e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 w-48 placeholder:text-slate-300"
              placeholder="Untitled Chatbot"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {[
            { id: 'Flow', icon: Layout },
            { id: 'Theme', icon: Palette },
            { id: 'Settings', icon: Settings },
            { id: 'Share', icon: Share2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab.id 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon size={12} />
                {tab.id}
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Play size={12} className="text-white fill-white" />
            Test
          </button>
          <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95">
            <Send size={12} />
            Publish
          </button>
        </div>
      </nav>
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </>
  );
}
