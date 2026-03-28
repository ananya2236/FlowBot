"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import useStore from '@/lib/store';

export default function CreateBotButton() {
  const router = useRouter();
  const { createBot } = useStore();

  const handleCreate = () => {
    const id = createBot();
    router.push(`/bot/${id}/edit`);
  };

  return (
    <button
      onClick={handleCreate}
      className="flex flex-col items-center justify-center p-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer group active:scale-[0.98] h-[200px]"
    >
      <div className="p-3 bg-slate-50 rounded-xl mb-4 group-hover:bg-white group-hover:scale-110 transition-all border border-slate-100 group-hover:border-orange-200 shadow-sm">
        <Plus size={24} className="text-slate-400 group-hover:text-orange-500" strokeWidth={3} />
      </div>
      <h3 className="text-[15px] font-bold text-black mb-1 group-hover:text-orange-500 transition-colors">Create New Bot</h3>
      <p className="text-[11px] font-bold text-slate-400 text-center px-4 leading-relaxed uppercase tracking-widest">
        Start from scratch
      </p>
    </button>
  );
}
