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
      className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-accent to-accent/80 border border-accent/20 rounded-2xl hover:from-accent/90 hover:to-accent transition-all cursor-pointer shadow-xl shadow-accent/20 group active:scale-[0.98]"
    >
      <div className="p-4 bg-white/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner border border-white/10">
        <Plus size={32} className="text-white" strokeWidth={3} />
      </div>
      <h3 className="text-lg font-black text-white mb-1 tracking-tight">Create a Spinabot</h3>
      <p className="text-xs font-bold text-white/60 text-center px-4 leading-relaxed uppercase tracking-widest">
        Start building from scratch
      </p>
    </button>
  );
}
