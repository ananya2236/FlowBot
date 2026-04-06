"use client";

import React from 'react';
import useStore from '@/lib/store';
import FlowPreview from '@/components/Preview/FlowPreview';

export default function PreviewModal({
  isOpen,
  onClose,
  botId,
}: {
  isOpen: boolean;
  onClose: () => void;
  botId?: string;
}) {
  const { bots, activeBotId } = useStore();
  const activeBot = bots.find((bot) => bot.id === (botId || activeBotId));

  if (!isOpen || !activeBot) return null;

  return (
    <aside className="absolute right-0 top-0 z-[90] h-full w-[430px] border-l border-slate-200 bg-[#F7F8FC] p-4 shadow-[-16px_0_32px_rgba(15,23,42,0.08)]">
      <FlowPreview
        bot={activeBot}
        className="rounded-[28px] border-orange-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        headerLabel="Preview"
        onClose={onClose}
        syncPreviewNode
      />
    </aside>
  );
}
