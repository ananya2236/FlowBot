"use client";
import React from 'react';
import {
  Type,
  Image as ImageIcon,
  Video,
  Mic,
  MessageSquare,
  Mail,
  Phone,
  Hash,
  Calendar,
  Globe,
  Star,
  FileText,
  Clock,
  Lock,
  Code,
  ArrowRight,
  GitBranch,
  CornerDownRight,
  CornerUpLeft,
  Shuffle,
  Timer,
  Flag,
  Command,
  Reply,
  XCircle,
  Sheet,
  BarChart3,
  Zap,
  Send,
  CreditCard,
  LayoutGrid,
  Upload,
  ListChecks,
  SquareStack,
} from 'lucide-react';
import { isSupportedSidebarType } from '@/lib/blocks';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  badge?: boolean;
}

const SECTIONS = [
  {
    title: 'Bubbles',
    items: [
      { id: 'bubble', label: 'Text', icon: MessageSquare, color: 'text-blue-500' },
      { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-purple-500' },
      { id: 'video', label: 'Video', icon: Video, color: 'text-blue-400' },
      { id: 'embed', label: 'Embed', icon: FileText, color: 'text-orange-400' },
      { id: 'audio', label: 'Audio', icon: Mic, color: 'text-blue-400' },
    ],
  },
  {
    title: 'Inputs',
    items: [
      { id: 'input_text', label: 'Text', icon: Type, color: 'text-orange-500' },
      { id: 'input_number', label: 'Number', icon: Hash, color: 'text-orange-500' },
      { id: 'input_email', label: 'Email', icon: Mail, color: 'text-orange-500' },
      { id: 'input_website', label: 'Website', icon: Globe, color: 'text-orange-500' },
      { id: 'input_date', label: 'Date', icon: Calendar, color: 'text-orange-500' },
      { id: 'input_time', label: 'Time', icon: Clock, color: 'text-orange-500' },
      { id: 'input_phone', label: 'Phone', icon: Phone, color: 'text-orange-500' },
      { id: 'input_buttons', label: 'Buttons', icon: ListChecks, color: 'text-orange-500' },
      { id: 'input_pic_choice', label: 'Pic choice', icon: LayoutGrid, color: 'text-orange-500' },
      { id: 'input_payment', label: 'Payment', icon: CreditCard, color: 'text-orange-500' },
      { id: 'input_rating', label: 'Rating', icon: Star, color: 'text-orange-500' },
      { id: 'input_file', label: 'File', icon: Upload, color: 'text-orange-500', badge: true },
      { id: 'input_cards', label: 'Cards', icon: SquareStack, color: 'text-orange-500' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { id: 'logic_set_variable', label: 'Set variable', icon: Code, color: 'text-purple-500' },
      { id: 'logic_condition', label: 'Condition', icon: GitBranch, color: 'text-purple-500' },
      { id: 'logic_redirect', label: 'Redirect', icon: ArrowRight, color: 'text-purple-500' },
      { id: 'logic_script', label: 'Script', icon: FileText, color: 'text-purple-500' },
      { id: 'logic_typebot', label: 'Typebot', icon: MessageSquare, color: 'text-purple-500' },
      { id: 'logic_wait', label: 'Wait', icon: Timer, color: 'text-purple-500' },
      { id: 'logic_ab_test', label: 'AB Test', icon: Shuffle, color: 'text-purple-500' },
      { id: 'logic_webhook', label: 'Webhook', icon: Zap, color: 'text-purple-500' },
      { id: 'logic_jump', label: 'Jump', icon: CornerDownRight, color: 'text-purple-500' },
      { id: 'logic_return', label: 'Return', icon: CornerUpLeft, color: 'text-purple-500' },
    ],
  },
  {
    title: 'Events',
    items: [
      { id: 'event_start', label: 'Start', icon: Flag, color: 'text-gray-500' },
      { id: 'event_command', label: 'Command', icon: Command, color: 'text-gray-500' },
      { id: 'event_reply', label: 'Reply', icon: Reply, color: 'text-gray-500' },
      { id: 'event_invalid', label: 'Invalid', icon: XCircle, color: 'text-gray-500' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { id: 'integration_sheets', label: 'Sheets', icon: Sheet, color: 'text-green-500' },
      { id: 'integration_analytics', label: 'Analytics', icon: BarChart3, color: 'text-yellow-500' },
      { id: 'integration_webhook', label: 'HTTP request', icon: Zap, color: 'text-blue-500' },
      { id: 'integration_email', label: 'Email', icon: Send, color: 'text-blue-500' },
    ],
  },
];

export default function EditorSidebar() {
  const [search, setSearch] = React.useState('');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    if (!isSupportedSidebarType(nodeType)) return;
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-[300px] bg-white border-r border-gray-200 flex flex-col h-full select-none">
      {/* Search + Lock */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-gray-300"
          />
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
          <Lock size={15} />
        </button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {SECTIONS.map((section) => {
          const filtered = section.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return null;

          return (
            <div key={section.title} className="mt-4 first:mt-2">
              <h3 className="text-[13px] font-bold text-gray-800 mb-2">{section.title}</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {filtered.map((item: SidebarItem) => (
                  <div
                    key={item.id}
                    draggable={isSupportedSidebarType(item.id)}
                    onDragStart={(e) => onDragStart(e, item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 transition-all text-left relative ${
                      isSupportedSidebarType(item.id)
                        ? 'cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-sm'
                        : 'cursor-not-allowed opacity-55'
                    }`}
                  >
                    <item.icon size={15} className={`${item.color} shrink-0`} />
                    <span className="text-[12px] font-medium text-gray-700 truncate">{item.label}</span>
                    {!isSupportedSidebarType(item.id) ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    ) : item.badge ? (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                        <Lock size={8} className="text-orange-500" />
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
