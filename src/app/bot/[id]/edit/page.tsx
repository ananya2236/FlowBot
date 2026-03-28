"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useStore from '@/lib/store';
import EditorNavbar from '@/components/Navbar/EditorNavbar';
import EditorSidebar from '@/components/Sidebar/EditorSidebar';
import FlowBuilder from '@/components/FlowBuilder';
import { 
  Palette, 
  Settings as SettingsIcon, 
  Share2, 
  Layout, 
  Copy, 
  Globe, 
  Code,
  CheckCircle2,
  Clock,
  Shield,
  Monitor,
  Bot,
  ChevronLeft
} from 'lucide-react';

export default function BotEditorPage() {
  const { id } = useParams();
  const { setActiveBot, bots } = useStore();
  const botId = Array.isArray(id) ? id[0] : id;
  const [activeTab, setActiveTab] = useState('Flow');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveBot(botId ?? null);
    return () => setActiveBot(null);
  }, [botId, setActiveBot]);

  const bot = bots.find((b) => b.id === botId);

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot size={32} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bot not found</h1>
          <p className="text-slate-500 mb-8 font-medium">The bot you're looking for doesn't exist or has been deleted.</p>
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
          <div className="flex flex-1 relative overflow-hidden bg-white">
            <EditorSidebar />
            <main className="flex-1 relative overflow-hidden">
              <FlowBuilder />
            </main>
          </div>
        );
      case 'Theme':
        return (
          <div className="flex-1 overflow-y-auto p-12 bg-white dotted-bg">
            <div className="max-w-4xl mx-auto">
              <header className="mb-12">
                <h2 className="text-4xl font-bold mb-2 tracking-tight text-black">Theme Settings</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Customize your WhatsApp bot's visual identity</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4 tracking-tight flex items-center gap-2 text-black">
                      <Layout size={20} className="text-orange-500" /> WhatsApp Templates
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['Minimal Light', 'Clean Business', 'Modern Orange', 'Technical Slate'].map((t) => (
                        <div key={t} className="aspect-video bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 hover:border-orange-500 transition-all cursor-pointer group relative overflow-hidden">
                          <div className="h-full flex flex-col justify-between relative z-10">
                            <div className="w-8 h-1.5 bg-slate-200 rounded-full" />
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-black transition-colors">{t}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
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
              <p className="text-slate-400 text-sm font-medium mt-1">We're working hard to bring this feature to you.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <EditorNavbar />
      {renderContent()}
    </div>
  );
}
