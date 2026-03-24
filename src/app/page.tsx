"use client";
import React from 'react';
import useStore from '@/lib/store';
import ProjectCard from '@/components/Dashboard/ProjectCard';
import CreateBotButton from '@/components/Dashboard/CreateBotButton';
import { Bot, LayoutGrid, List, Search, Ghost } from 'lucide-react';

export default function Dashboard() {
  const { bots } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-accent/30 selection:text-white">
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent rounded-xl shadow-[0_0_20px_rgba(255,106,0,0.4)]">
              <Bot size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-black tracking-tighter">Spinabot</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Search bots..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 w-64 transition-all text-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button className="p-1.5 rounded-lg bg-zinc-800 text-white shadow-lg"><LayoutGrid size={16} /></button>
              <button className="p-1.5 rounded-lg text-zinc-600 hover:text-white transition-colors"><List size={16} /></button>
            </div>
            <div className="w-9 h-9 bg-gradient-to-tr from-zinc-800 to-zinc-700 rounded-xl shadow-lg border border-zinc-700/50" />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2 tracking-tighter">Your Spinabots</h2>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
              You have {bots.length} active projects
            </p>
          </div>
        </header>

        {bots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-3xl">
            <div className="p-6 bg-zinc-900 rounded-full mb-6 text-zinc-700 border border-zinc-800 shadow-xl">
              <Ghost size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">No bots found</h3>
            <p className="text-zinc-500 text-sm font-medium mb-8 max-w-xs text-center leading-relaxed">
              Create your first chatbot and start collecting leads today.
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
