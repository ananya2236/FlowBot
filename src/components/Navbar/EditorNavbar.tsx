"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Undo2, Redo2, HelpCircle, Share2, Play, FileText, X, Copy, Download } from 'lucide-react';
import useStore from '@/lib/store';
import { buildImplementationPayload, type ImplementationPayload } from '@/lib/implementation';

interface EditorNavbarProps {
  botId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTestClick: () => void;
}

export default function EditorNavbar({ botId, activeTab, setActiveTab, onTestClick }: EditorNavbarProps) {
  const router = useRouter();
  const { bots, renameBot, setBotStatus } = useStore();
  const bot = bots.find((b) => b.id === botId);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);
  const [scriptEndpoint, setScriptEndpoint] = React.useState('');
  const [workspaceLink, setWorkspaceLink] = React.useState('');
  const [publishPayload, setPublishPayload] = React.useState<ImplementationPayload | null>(null);
  const [publishMessage, setPublishMessage] = React.useState<string | null>(null);

  if (!bot) return null;

  const tabs = ['Flow', 'Theme', 'Settings', 'Share'];

  const generatePayload = () => {
    const endpoint = scriptEndpoint.trim();
    if (!endpoint) {
      setPublishMessage('Add your script endpoint link to generate the implementation payload.');
      return;
    }

    const payload = buildImplementationPayload(bot, {
      scriptEndpoint: endpoint,
      workspaceLink: workspaceLink.trim() || undefined,
    });
    setPublishPayload(payload);
    setBotStatus(botId, 'Live');
    setPublishMessage('Implementation payload generated. You can now copy or download it.');
  };

  const copyPayload = async () => {
    if (!publishPayload) return;
    await navigator.clipboard.writeText(JSON.stringify(publishPayload, null, 2));
    setPublishMessage('Payload copied to clipboard.');
  };

  const downloadPayload = () => {
    if (!publishPayload) return;
    const blob = new Blob([JSON.stringify(publishPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${bot.name.replace(/\s+/g, '_').toLowerCase()}_implementation.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setPublishMessage('Payload downloaded.');
  };

  return (
    <>
      <nav className="h-[48px] bg-white sticky top-0 z-50 flex items-center justify-between px-4 border-b-2 border-orange-500">
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
            onClick={onTestClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Play size={12} />
            Test
          </button>
          <button
            onClick={() => setIsPublishOpen(true)}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
          >
            Publish
          </button>
        </div>
      </nav>

      {isPublishOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Publish Flow To Workspace</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Generate a script-ready payload from this canvas flow.
                </p>
              </div>
              <button
                onClick={() => setIsPublishOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Script endpoint</span>
                  <input
                    type="url"
                    value={scriptEndpoint}
                    onChange={(event) => setScriptEndpoint(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
                    placeholder="https://workspace.example.com/api/run-flow-script"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Workspace link (optional)</span>
                  <input
                    type="url"
                    value={workspaceLink}
                    onChange={(event) => setWorkspaceLink(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-orange-400"
                    placeholder="https://workspace.example.com"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={generatePayload}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  Generate payload
                </button>
                <button
                  onClick={() => void copyPayload()}
                  disabled={!publishPayload}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Copy size={13} />
                    Copy JSON
                  </span>
                </button>
                <button
                  onClick={downloadPayload}
                  disabled={!publishPayload}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Download size={13} />
                    Download JSON
                  </span>
                </button>
              </div>

              {publishMessage ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {publishMessage}
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Payload preview</div>
                <pre className="max-h-72 overflow-auto rounded-lg bg-white border border-slate-200 p-3 text-[11px] leading-relaxed text-slate-700">
                  {publishPayload ? JSON.stringify(publishPayload, null, 2) : '{\n  "flow": "Generate payload to preview export JSON"\n}'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
