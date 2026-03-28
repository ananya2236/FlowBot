"use client";
import React, { useState } from 'react';
import useStore from '@/lib/store';
import ProjectCard from '@/components/Dashboard/ProjectCard';
import CreateBotButton from '@/components/Dashboard/CreateBotButton';
import { Bot, LayoutGrid, List, Search, Plus } from 'lucide-react';

export default function Dashboard() {
  const { bots } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] font-sans selection:bg-orange-100">
      <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl shadow-lg shadow-orange-200">
              <Bot size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Spinabot</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 w-64 transition-all text-sm font-medium"
              />
            </div>
            <div className="w-9 h-9 bg-slate-100 rounded-xl border border-slate-200" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Your Projects</h2>
            <p className="text-slate-500 text-sm font-medium">
              You have <span className="text-black font-bold">{bots.length}</span> active chatbots
            </p>
          </div>
        </header>

        {bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-50 border border-slate-100 rounded-3xl border-dashed">
            <div className="p-6 bg-white rounded-2xl mb-6 text-orange-500 border border-slate-100 shadow-sm">
              <Bot size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold mb-2">Create your first bot</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 max-w-xs text-center leading-relaxed">
              Build your WhatsApp automation flow in minutes with our group-based builder.
            </p>
            <CreateBotButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <CreateBotButton />
            {filteredBots.map((bot) => (
              <ProjectCard key={bot.id} bot={bot} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
