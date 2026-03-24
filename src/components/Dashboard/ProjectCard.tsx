"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Trash2, Edit2, Clock } from 'lucide-react';
import { Bot } from '@/lib/store';
import useStore from '@/lib/store';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectCardProps {
  bot: Bot;
}

export default function ProjectCard({ bot }: ProjectCardProps) {
  const router = useRouter();
  const { deleteBot, renameBot } = useStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
      className="group relative flex flex-col justify-between p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-accent hover:bg-zinc-800/60 transition-all cursor-pointer shadow-xl hover:shadow-accent/5 backdrop-blur-sm active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-zinc-700 transition-colors border border-zinc-700/50">
          <div className="w-6 h-6 bg-accent rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
        </div>
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1.5 hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-white transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-10 backdrop-blur-xl">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Rename bot:', bot.name);
                  if (newName) renameBot(bot.id, newName);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Edit2 size={14} /> Rename
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this bot?')) deleteBot(bot.id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-1 truncate tracking-tight">{bot.name}</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className={cn(
            "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
            bot.status === 'Live' ? "text-green-500 bg-green-500" : "text-orange-500 bg-orange-500"
          )} />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{bot.status}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
        <Clock size={12} />
        <span>Updated {formatDate(bot.updatedAt)}</span>
      </div>
    </div>
  );
}
