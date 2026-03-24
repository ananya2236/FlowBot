"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Play, Send, Layout, Palette, Settings, Share2 } from 'lucide-react';
import useStore from '@/lib/store';

interface EditorNavbarProps {
  botId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function EditorNavbar({ botId, activeTab, setActiveTab }: EditorNavbarProps) {
  const router = useRouter();
  const { bots, renameBot } = useStore();
  const bot = bots.find((b) => b.id === botId);

  if (!bot) return null;

  return (
    <nav className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={() => router.push('/')}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors border border-transparent hover:border-zinc-700"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="h-4 w-px bg-zinc-800 mx-1" />
        <input 
          type="text" 
          value={bot.name}
          onChange={(e) => renameBot(botId, e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm font-black text-white hover:bg-zinc-900 px-3 py-1.5 rounded-xl transition-all w-48 truncate tracking-tight"
        />
      </div>

      <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-1 gap-1 shadow-inner">
        {[
          { id: 'Flow', icon: Layout },
          { id: 'Theme', icon: Palette },
          { id: 'Settings', icon: Settings },
          { id: 'Share', icon: Share2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? "bg-zinc-800 text-accent shadow-lg shadow-black/20" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <tab.icon size={12} strokeWidth={2.5} />
            {tab.id}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-1 justify-end">
        <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800">
          <Play size={12} strokeWidth={3} /> Test
        </button>
        <button className="flex items-center gap-2 px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 transition-all active:scale-[0.98]">
          <Send size={12} strokeWidth={3} /> Publish
        </button>
      </div>
    </nav>
  );
}
