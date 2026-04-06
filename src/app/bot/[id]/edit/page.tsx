"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useStore from '@/lib/store';
import EditorNavbar from '@/components/Navbar/EditorNavbar';
import EditorSidebar from '@/components/Sidebar/EditorSidebar';
import FlowBuilder from '@/components/FlowBuilder';
import NodeEditor from '@/components/NodeEditor';
import PreviewModal from '@/components/Preview/PreviewModal';
import ThemeEditor from '@/components/Theme/ThemeEditor';
import { Settings as SettingsIcon, Bot, Share2, Copy, Check, ShieldCheck } from 'lucide-react';

export default function BotEditorPage() {
  const { id } = useParams();
  const { setActiveBot, bots, renameBot, setBotStatus, botsLoaded, remoteEnabled } = useStore();
  const botId = Array.isArray(id) ? id[0] : id;
  const [activeTab, setActiveTab] = useState('Flow');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setActiveBot(botId ?? null);
    return () => setActiveBot(null);
  }, [botId, setActiveBot]);

  const bot = bots.find((b) => b.id === botId);

  if (!botsLoaded && remoteEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Bot size={32} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Loading bot</h1>
          <p className="text-slate-500 font-medium">Fetching the latest workflow from Convex.</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot size={32} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bot not found</h1>
          <p className="text-slate-500 mb-8 font-medium">The bot you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'Flow':
        return (
          <div className="flex flex-1 min-h-0 relative overflow-hidden bg-white">
            <EditorSidebar />
            <main className={`flex-1 h-full min-h-0 relative overflow-hidden transition-all duration-300 ${isPreviewOpen ? 'pr-[430px]' : ''}`}>
              <FlowBuilder />
            </main>
            <NodeEditor />
            <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} botId={botId || ''} />
          </div>
        );
      case 'Theme':
        return <ThemeEditor bot={bot} />;
      case 'Settings':
        return (
          <div className="flex-1 overflow-y-auto p-12 bg-white dotted-bg">
            <div className="max-w-3xl mx-auto space-y-6">
              <header className="mb-6">
                <h2 className="text-4xl font-bold mb-2 tracking-tight text-black">Bot Settings</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Configure bot identity and release mode</p>
              </header>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Bot name</span>
                  <input
                    value={bot.name}
                    onChange={(event) => renameBot(bot.id, event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setBotStatus(bot.id, 'Draft')}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      bot.status === 'Draft' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Set Draft
                  </button>
                  <button
                    onClick={() => setBotStatus(bot.id, 'Live')}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      bot.status === 'Live' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Set Live
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-500" />
                  Current status: <span className="font-bold">{bot.status}</span>
                </div>
              </section>
            </div>
          </div>
        );
      case 'Share':
        return (
          <div className="flex-1 overflow-y-auto p-12 bg-white dotted-bg">
            <div className="max-w-3xl mx-auto space-y-6">
              <header className="mb-6">
                <h2 className="text-4xl font-bold mb-2 tracking-tight text-black">Share</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Share editor access and collaboration links</p>
              </header>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Editor link</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 truncate">
                    {typeof window === 'undefined' ? '' : `${window.location.origin}/bot/${bot.id}/edit`}
                  </div>
                  <button
                    onClick={async () => {
                      const link = `${window.location.origin}/bot/${bot.id}/edit`;
                      await navigator.clipboard.writeText(link);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copied ? 'Copied' : 'Copy'}
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('Flow')}
                  className="mt-4 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-600 inline-flex items-center gap-1.5"
                >
                  <Share2 size={13} />
                  Return To Flow
                </button>
              </section>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <SettingsIcon size={24} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-black">{activeTab} coming soon</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">We&apos;re working hard to bring this feature to you.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${activeTab === 'Theme' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <EditorNavbar
        botId={botId || ''}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTestClick={() => setIsPreviewOpen(true)}
      />
      {renderContent()}
    </div>
  );
}
