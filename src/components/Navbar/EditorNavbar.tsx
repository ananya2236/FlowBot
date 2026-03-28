"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Undo2, Redo2, HelpCircle, Share2, Play, FileText } from 'lucide-react';
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

  const tabs = ['Flow', 'Theme', 'Settings', 'Share'];

  return (
    <>
      <nav className="h-[48px] border-b border-gray-200 bg-white sticky top-0 z-50 flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-800"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2 pl-1">
            <FileText size={16} className="text-gray-400" />
            <input
              type="text"
              value={bot.name || ''}
              onChange={(e) => renameBot(botId, e.target.value)}
              className="bg-transparent border-none focus:ring-0 focus:outline-none text-[13px] font-medium text-gray-700 w-36 placeholder:text-gray-300"
              placeholder="My typebot"
            />
          </div>
          <div className="flex items-center gap-0.5 ml-2">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <Undo2 size={15} />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <Redo2 size={15} />
            </button>
          </div>
          <button className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-[12px] font-medium">
            <HelpCircle size={14} />
            Help
          </button>
        </div>

        {/* Center tabs */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === tab
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 size={14} />
            Share
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Play size={12} />
            Test
          </button>
          <button className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors">
            Publish
          </button>
        </div>
      </nav>
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </>
  );
}
