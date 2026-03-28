"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import useStore from '@/lib/store';
import {
  MessageSquare,
  Image as ImageIcon,
  Video,
  Mic,
  Plus,
  Globe,
  FileText,
  Hash,
  Mail,
  Calendar,
  Phone,
  Star,
  File,
  Type as TypeIcon,
  Play,
  Copy,
  Trash2,
} from 'lucide-react';

/* ── Data model ─────────────────────────────────────────────── */

export interface Block {
  id: string;
  kind: 'bubble' | 'input';
  type: string;
  content: string;
  variable?: string;
  placeholder?: string;
  meta?: any;
}

export interface GroupNodeData {
  title: string;
  blocks: Block[];
  bubbles?: any[];
  inputs?: any[];
}

/* ── Block type config ──────────────────────────────────────── */

const BLOCK_TYPES: Record<string, { icon: any; label: string; color: string; border: string; bg: string }> = {
  text:          { icon: MessageSquare, label: 'Text',         color: 'text-blue-600',    border: 'border-l-blue-400',   bg: 'bg-blue-50' },
  image:         { icon: ImageIcon,     label: 'Image',        color: 'text-purple-600',  border: 'border-l-purple-400', bg: 'bg-purple-50' },
  video:         { icon: Video,         label: 'Video',        color: 'text-indigo-600',  border: 'border-l-indigo-400', bg: 'bg-indigo-50' },
  audio:         { icon: Mic,           label: 'Audio',        color: 'text-emerald-600', border: 'border-l-emerald-400',bg: 'bg-emerald-50' },
  embed:         { icon: FileText,      label: 'Embed',        color: 'text-gray-600',    border: 'border-l-gray-400',   bg: 'bg-gray-100' },
  input_text:    { icon: TypeIcon,      label: 'Text input',   color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_number:  { icon: Hash,          label: 'Number',       color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_email:   { icon: Mail,          label: 'Email',        color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_website: { icon: Globe,         label: 'Website',      color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_date:    { icon: Calendar,      label: 'Date',         color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_phone:   { icon: Phone,         label: 'Phone',        color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_rating:  { icon: Star,          label: 'Rating',       color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
  input_file:    { icon: File,          label: 'File upload',  color: 'text-orange-600',  border: 'border-l-orange-400', bg: 'bg-orange-50' },
};

function cfg(block: Block) {
  const key = block.kind === 'input' ? `input_${block.type}` : block.type;
  return BLOCK_TYPES[key] || BLOCK_TYPES.text;
}

/* ── Helpers ────────────────────────────────────────────────── */

function migrateToBlocks(data: GroupNodeData): Block[] {
  if (data.blocks?.length) return data.blocks;
  const blocks: Block[] = [];
  for (const b of data.bubbles || [])
    blocks.push({ id: b.id, kind: 'bubble', type: b.type || 'text', content: b.content || '', meta: b.meta });
  for (const i of data.inputs || [])
    blocks.push({ id: i.id, kind: 'input', type: i.type || 'text', content: '', variable: i.variable, placeholder: i.placeholder });
  return blocks;
}

function newId() { return Math.random().toString(36).substr(2, 9); }

export function createBlockFromSidebar(sidebarType: string): Block | null {
  const id = newId();
  if (sidebarType.startsWith('input_')) {
    const t = sidebarType.replace('input_', '');
    return { id, kind: 'input', type: t, content: '', variable: `user_${t}_${Date.now() % 1000}`, placeholder: `Enter ${t}...` };
  }
  if (['bubble', 'text', 'image', 'video', 'audio', 'embed'].includes(sidebarType)) {
    const t = sidebarType === 'bubble' ? 'text' : sidebarType;
    return { id, kind: 'bubble', type: t, content: t === 'text' ? 'Hello!' : '' };
  }
  return null;
}

function toLegacy(blocks: Block[]) {
  return {
    bubbles: blocks.filter(b => b.kind === 'bubble').map(b => ({ id: b.id, type: b.type, content: b.content, meta: b.meta })),
    inputs:  blocks.filter(b => b.kind === 'input').map(b => ({ id: b.id, type: b.type, variable: b.variable, placeholder: b.placeholder })),
  };
}

/* ── GroupNode ──────────────────────────────────────────────── */

const GroupNode = ({ id, data, selected }: { id: string; data: GroupNodeData; selected: boolean }) => {
  const { updateNodeData } = useStore();
  const [title, setTitle] = useState(data.title || 'Group #1');
  const [blocks, setBlocksRaw] = useState<Block[]>(() => migrateToBlocks(data));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync to store (debounced)
  const blocksRef = useRef(blocks);
  const titleRef  = useRef(title);
  blocksRef.current = blocks;
  titleRef.current  = title;

  useEffect(() => {
    const t = setTimeout(() => {
      const legacy = toLegacy(blocksRef.current);
      updateNodeData(id, { title: titleRef.current, blocks: blocksRef.current, ...legacy });
    }, 120);
    return () => clearTimeout(t);
  }, [blocks, title, id, updateNodeData]);

  // Close menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowAddMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Block ops ── */
  const setBlocks = useCallback((fn: (prev: Block[]) => Block[]) => setBlocksRaw(fn), []);

  const addBlock = useCallback((sidebarType: string) => {
    const block = createBlockFromSidebar(sidebarType);
    if (block) setBlocks(p => [...p, block]);
    setShowAddMenu(false);
  }, [setBlocks]);

  const updateBlock = useCallback((bid: string, u: Partial<Block>) => setBlocks(p => p.map(b => b.id === bid ? { ...b, ...u } : b)), [setBlocks]);

  /* ── Internal drag reorder ── */
  const onBlockDragStart = useCallback((e: React.DragEvent, i: number) => {
    e.dataTransfer.setData('application/block-reorder', String(i));
    e.dataTransfer.effectAllowed = 'move';
    setDragIdx(i);
  }, []);

  const onZoneDragOver = useCallback((e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropIdx(i);
  }, []);

  const onZoneDrop = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    const srcStr = e.dataTransfer.getData('application/block-reorder');
    const extType = e.dataTransfer.getData('application/reactflow');

    if (srcStr !== '') {
      const src = parseInt(srcStr);
      if (src !== targetIdx && src !== targetIdx - 1) {
        setBlocks(prev => {
          const next = [...prev];
          const [moved] = next.splice(src, 1);
          const dest = src < targetIdx ? targetIdx - 1 : targetIdx;
          next.splice(dest, 0, moved);
          return next;
        });
      }
    } else if (extType) {
      const block = createBlockFromSidebar(extType);
      if (block) setBlocks(prev => { const n = [...prev]; n.splice(targetIdx, 0, block); return n; });
    }
    setDragIdx(null);
    setDropIdx(null);
  }, [setBlocks]);

  /* ── Group-level drop (append) ── */
  const onGroupDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/reactflow') || e.dataTransfer.types.includes('application/block-reorder')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDropIdx(blocks.length);
    }
  }, [blocks.length]);

  const onGroupDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const extType = e.dataTransfer.getData('application/reactflow');
    if (extType) {
      const block = createBlockFromSidebar(extType);
      if (block) setBlocks(p => [...p, block]);
    }
    setDragIdx(null);
    setDropIdx(null);
  }, [setBlocks]);

  const onDragEnd = useCallback(() => { setDragIdx(null); setDropIdx(null); }, []);

  return (
    <div
      className={`typebot-group w-[280px] ${selected ? 'selected' : ''}`}
      onDragOver={onGroupDragOver}
      onDrop={onGroupDrop}
      role="group"
      aria-label={`Group: ${title}`}
      tabIndex={0}
    >
      {/* Floating toolbar on select */}
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-50 nodrag nopan">
          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors" title="Test group">
            <Play size={14} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors" title="Duplicate group">
            <Copy size={14} />
          </button>
          <button
            onClick={() => {
              const { onNodesChange } = useStore.getState();
              onNodesChange([{ type: 'remove', id }]);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete group"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Left target handle */}
      <Handle type="target" position={Position.Left} id="main-target" className="!-left-[6px]" style={{ top: 24 }} />

      {/* Header */}
      <div className="typebot-group-header">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={e => { if (e.key === 'Enter') setEditingTitle(false); }}
            className="nodrag nopan bg-transparent border-none p-0 text-[13px] font-semibold text-gray-800 w-full outline-none focus:text-black"
            placeholder="Group title"
          />
        ) : (
          <span
            onDoubleClick={() => setEditingTitle(true)}
            className="text-[13px] font-semibold text-gray-800 cursor-default select-none block w-full truncate"
          >
            {title || 'Group title'}
          </span>
        )}
      </div>

      {/* Blocks */}
      <div className="flex flex-col">
        {blocks.map((block, i) => {
          const c = cfg(block);
          return (
            <React.Fragment key={block.id}>
              {/* Drop zone BEFORE this block */}
              <div
                className={`typebot-dropzone ${dropIdx === i ? 'active' : ''}`}
                onDragOver={e => onZoneDragOver(e, i)}
                onDrop={e => onZoneDrop(e, i)}
                onDragLeave={() => setDropIdx(null)}
              />

              {/* Block */}
              <div
                className={`typebot-block group/block ${dragIdx === i ? 'opacity-30' : ''}`}
                draggable
                onDragStart={e => onBlockDragStart(e, i)}
                onDragEnd={onDragEnd}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${c.bg}`}>
                    <c.icon size={11} className={c.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <BlockContent block={block} onUpdate={u => updateBlock(block.id, u)} />
                  </div>
                </div>

                {/* Source handle for every block */}
                <Handle type="source" position={Position.Right} id={`handle-${block.id}`} className="!-right-[6px]" style={{ top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </React.Fragment>
          );
        })}

        {/* Drop zone at the end */}
        <div
          className={`typebot-dropzone ${dropIdx === blocks.length ? 'active' : ''}`}
          onDragOver={e => onZoneDragOver(e, blocks.length)}
          onDrop={e => onZoneDrop(e, blocks.length)}
          onDragLeave={() => setDropIdx(null)}
        />
      </div>

      {/* Add block button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="nodrag nopan w-full flex items-center justify-center gap-1.5 py-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50/60 transition-all text-[11px] font-medium border-t border-gray-100"
        >
          <Plus size={14} />
          <span>Add block</span>
        </button>
        {showAddMenu && <AddBlockMenu onAdd={addBlock} />}
      </div>

      {/* Source handle fallback when no blocks */}
      {blocks.length === 0 && (
        <Handle type="source" position={Position.Right} id="main-source" className="!-right-[6px]" style={{ top: '50%', transform: 'translateY(-50%)' }} />
      )}
    </div>
  );
};

/* ── Inline block content ───────────────────────────────────── */

const BlockContent = ({ block, onUpdate }: { block: Block; onUpdate: (u: Partial<Block>) => void }) => {
  if (block.kind === 'bubble') {
    switch (block.type) {
      case 'text':
        return (
          <textarea
            value={block.content}
            onChange={e => onUpdate({ content: e.target.value })}
            placeholder="Click to edit..."
            className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] text-gray-600 placeholder:text-gray-400 resize-none min-h-[16px] outline-none leading-snug"
            onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; }}
            rows={1}
          />
        );
      case 'image': case 'video': case 'audio':
        return (
          <input
            value={block.content}
            onChange={e => onUpdate({ content: e.target.value })}
            placeholder={`${block.type} URL...`}
            className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] text-gray-500 placeholder:text-gray-400 outline-none"
          />
        );
      case 'embed':
        return (
          <input
            value={block.content}
            onChange={e => onUpdate({ content: e.target.value })}
            placeholder="Paste URL..."
            className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] text-gray-500 placeholder:text-gray-400 outline-none"
          />
        );
    }
  }

  if (block.kind === 'input') {
    return (
      <span className="text-[12px] text-gray-400 nodrag nopan">
        {block.placeholder || `Type your ${block.type}...`}
      </span>
    );
  }

  return null;
};

/* ── Add block menu ─────────────────────────────────────────── */

const BUBBLE_ITEMS = [
  { id: 'text',  label: 'Text',  icon: MessageSquare, color: 'text-blue-500' },
  { id: 'image', label: 'Image', icon: ImageIcon,     color: 'text-purple-500' },
  { id: 'video', label: 'Video', icon: Video,         color: 'text-indigo-500' },
  { id: 'audio', label: 'Audio', icon: Mic,           color: 'text-emerald-500' },
  { id: 'embed', label: 'Embed', icon: FileText,      color: 'text-gray-500' },
];
const INPUT_ITEMS = [
  { id: 'input_text',   label: 'Text',   icon: TypeIcon, color: 'text-orange-500' },
  { id: 'input_number', label: 'Number', icon: Hash,     color: 'text-orange-500' },
  { id: 'input_email',  label: 'Email',  icon: Mail,     color: 'text-orange-500' },
  { id: 'input_date',   label: 'Date',   icon: Calendar, color: 'text-orange-500' },
  { id: 'input_phone',  label: 'Phone',  icon: Phone,    color: 'text-orange-500' },
  { id: 'input_file',   label: 'File',   icon: File,     color: 'text-orange-500' },
];

const AddBlockMenu = ({ onAdd }: { onAdd: (type: string) => void }) => (
  <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
    <div className="p-2">
      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Bubbles</div>
      <div className="grid grid-cols-3 gap-1">
        {BUBBLE_ITEMS.map(item => (
          <button key={item.id} onClick={() => onAdd(item.id)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <item.icon size={14} className={item.color} />
            <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 mt-1 border-t border-gray-50 pt-2">Inputs</div>
      <div className="grid grid-cols-3 gap-1">
        {INPUT_ITEMS.map(item => (
          <button key={item.id} onClick={() => onAdd(item.id)} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <item.icon size={14} className={item.color} />
            <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default GroupNode;
