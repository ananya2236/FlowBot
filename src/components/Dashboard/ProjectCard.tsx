"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Trash2, Edit2, Clock, Bot as BotIcon } from 'lucide-react';
import { Bot } from '@/lib/store';
import useStore from '@/lib/store';

interface ProjectCardProps {
  bot: Bot;
}

export default function ProjectCard({ bot }: ProjectCardProps) {
  const router = useRouter();
  const { deleteBot, renameBot } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      onClick={() => router.push(`/bot/${bot.id}/edit`)}
      className="group relative flex flex-col justify-between p-5 bg-white border-2 border-orange-500 rounded-2xl hover:shadow-xl hover:shadow-orange-500/5 transition-all cursor-pointer active:scale-[0.98] h-[200px]"
    >
      <div className="flex justify-between items-start">
        <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100 group-hover:bg-orange-100 transition-all">
          <BotIcon size={18} className="text-orange-500" />
        </div>
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 z-10">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Rename bot:', bot.name);
                  if (newName) renameBot(bot.id, newName);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-black hover:bg-slate-50 transition-colors"
              >
                <Edit2 size={14} /> Rename
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this bot?')) deleteBot(bot.id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-[15px] font-bold text-black truncate group-hover:text-orange-500 transition-colors">{bot.name}</h3>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${bot.status === 'Live' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-200'}`} />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{bot.status}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
        <Clock size={12} />
        <span>Modified {formatDate(bot.updatedAt)}</span>
      </div>
    </div>
  );
}
