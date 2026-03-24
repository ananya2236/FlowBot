"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useStore from '@/lib/store';
import EditorNavbar from '@/components/Navbar/EditorNavbar';
import EditorSidebar from '@/components/Sidebar/EditorSidebar';
import FlowBuilder from '@/components/FlowBuilder';
import NodeEditor from '@/components/NodeEditor';
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
  Bot
} from 'lucide-react';

export default function BotEditorPage() {
  const { id } = useParams();
  const { setActiveBot, bots } = useStore();
  const botId = Array.isArray(id) ? id[0] : id;
  const [activeTab, setActiveTab] = useState('Flow');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveBot(botId);
    return () => setActiveBot(null);
  }, [botId, setActiveBot]);

  const bot = bots.find((b) => b.id === botId);

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-4 tracking-tighter">Bot not found</h1>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-accent rounded-xl font-black uppercase tracking-widest text-xs"
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
          <div className="flex flex-1 relative overflow-hidden">
            <EditorSidebar />
            <main className="flex-1 relative overflow-hidden">
              <FlowBuilder />
            </main>
            <div className="w-80 border-l border-zinc-800 bg-zinc-950/50 backdrop-blur-sm z-40 overflow-y-auto scrollbar-hide">
              <NodeEditor />
            </div>
          </div>
        );
      case 'Theme':
        return (
          <div className="flex-1 overflow-y-auto p-12 bg-zinc-950 dotted-bg">
            <div className="max-w-4xl mx-auto">
              <header className="mb-12">
                <h2 className="text-4xl font-black mb-2 tracking-tighter">Theme Settings</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Customize the look and feel of your bot</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-8">
                  <div>
                    <h3 className="text-lg font-black mb-4 tracking-tight flex items-center gap-2">
                      <Layout size={20} className="text-accent" /> Templates
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['Dark Neon', 'Classic Blue', 'Emerald Soft', 'Midnight'].map((t) => (
                        <div key={t} className="aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-accent transition-all cursor-pointer group relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="h-full flex flex-col justify-between relative z-10">
                            <div className="w-8 h-1.5 bg-zinc-800 rounded-full" />
                            <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">{t}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black mb-4 tracking-tight flex items-center gap-2">
                      <Palette size={20} className="text-accent" /> Global Styles
                    </h3>
                    <div className="space-y-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Accent Color</span>
                        <div className="w-8 h-8 bg-accent rounded-lg shadow-[0_0_10px_rgba(255,106,0,0.5)] border border-white/10" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Background</span>
                        <div className="w-8 h-8 bg-zinc-950 rounded-lg border border-zinc-800" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Roundness</span>
                        <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full w-3/4 bg-accent" />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-8">
                   <div>
                    <h3 className="text-lg font-black mb-4 tracking-tight flex items-center gap-2">
                      <Monitor size={20} className="text-accent" /> Chat UI
                    </h3>
                    <div className="space-y-4 p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Avatar</span>
                        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Font Family</span>
                        <span className="text-xs font-black text-white bg-zinc-800 px-3 py-1 rounded-lg">Geist Sans</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black mb-4 tracking-tight flex items-center gap-2">
                      <Code size={20} className="text-accent" /> Custom CSS
                    </h3>
                    <textarea 
                      placeholder="/* Add your custom styles here */"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-xs font-mono text-zinc-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all min-h-[200px] shadow-xl"
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="flex-1 overflow-y-auto p-12 bg-zinc-950 dotted-bg">
            <div className="max-w-3xl mx-auto">
              <header className="mb-12">
                <h2 className="text-4xl font-black mb-2 tracking-tighter">Settings</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Configure bot behavior and security</p>
              </header>

              <div className="space-y-6">
                {[
                  { title: 'General', icon: SettingsIcon, desc: 'Manage basic bot identity and visibility' },
                  { title: 'Typing Settings', icon: Clock, desc: 'Adjust simulation of human-like typing' },
                  { title: 'Security', icon: Shield, desc: 'Domain restriction and access control' },
                  { title: 'Metadata', icon: Globe, desc: 'SEO and social sharing information' },
                ].map((s) => (
                  <div key={s.title} className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between group hover:border-zinc-700 transition-all cursor-pointer shadow-lg active:scale-[0.99]">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 group-hover:bg-zinc-800 transition-colors shadow-inner">
                        <s.icon size={24} className="text-accent" />
                      </div>
                      <div>
                        <h4 className="font-black text-white tracking-tight">{s.title}</h4>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">{s.desc}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center text-zinc-700 group-hover:text-accent transition-colors">
                      <ChevronLeft className="rotate-180" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Share':
        const botUrl = `https://spinabot.app/${botId}`;
        return (
          <div className="flex-1 overflow-y-auto p-12 bg-zinc-950 dotted-bg">
            <div className="max-w-4xl mx-auto">
              <header className="mb-12">
                <h2 className="text-4xl font-black mb-2 tracking-tighter">Share your Bot</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Deploy and embed your chatbot anywhere</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-8">
                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Globe size={120} className="text-accent" />
                    </div>
                    <h3 className="text-lg font-black mb-6 tracking-tight relative z-10">Direct Link</h3>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-inner mb-6">
                        <input 
                          readOnly 
                          value={botUrl}
                          className="flex-1 bg-transparent border-none text-xs font-bold text-zinc-400 px-4 focus:ring-0"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(botUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-800 text-zinc-400 hover:text-white"
                        >
                          {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                      <button className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 transition-all active:scale-[0.98]">
                        Add Custom Domain
                      </button>
                    </div>
                  </div>

                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
                    <h3 className="text-lg font-black mb-6 tracking-tight">Embed Options</h3>
                    <div className="space-y-4">
                      {['Iframe Embed', 'JS Script', 'NPM Package'].map((opt) => (
                        <div key={opt} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all cursor-pointer group active:scale-[0.99]">
                          <div className="flex items-center gap-4">
                            <Code size={18} className="text-accent" />
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{opt}</span>
                          </div>
                          <ChevronLeft className="rotate-180 text-zinc-700 group-hover:text-accent transition-colors" size={16} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl h-full flex flex-col">
                    <h3 className="text-lg font-black mb-6 tracking-tight">Preview</h3>
                    <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col shadow-inner overflow-hidden group">
                      <div className="h-10 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500/30" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500/30" />
                        <div className="w-2 h-2 rounded-full bg-green-500/30" />
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center group-hover:scale-105 transition-transform duration-500">
                         <div className="w-20 h-20 bg-accent rounded-3xl shadow-[0_0_30px_rgba(255,106,0,0.3)] flex items-center justify-center mb-6 border border-white/10">
                          <Bot size={40} className="text-white" strokeWidth={2.5} />
                        </div>
                        <h4 className="text-xl font-black text-white mb-2 tracking-tight">{bot.name}</h4>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest max-w-[200px]">Interactive chatbot experience live preview</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden selection:bg-accent/30 selection:text-white">
      <EditorNavbar botId={botId} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-1 relative overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
