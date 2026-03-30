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
  Hash,
  Mail,
  Calendar,
  Phone,
  Type as TypeIcon,
  Play,
  Copy,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Block,
  BubbleBlock,
  GroupNodeData,
  InputBlock,
  createDefaultBlock,
  getBlockLabel,
  isSupportedSidebarType,
  migrateToBlocks,
} from '@/lib/blocks';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const BLOCK_TYPES: Record<string, { icon: IconComponent; color: string; bg: string }> = {
  text: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  image: { icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
  video: { icon: Video, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  audio: { icon: Mic, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  embed: { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
  input_text: { icon: TypeIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_number: { icon: Hash, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_email: { icon: Mail, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_phone: { icon: Phone, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_date: { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
};

function getVisuals(block: Block) {
  const key = block.kind === 'input' ? `input_${block.type}` : block.type;
  return BLOCK_TYPES[key] || BLOCK_TYPES.text;
}

function syncNodeData(
  updateNodeData: (nodeId: string, data: Partial<GroupNodeData>) => void,
  nodeId: string,
  title: string,
  blocks: Block[],
  activeBlockId: string | null
) {
  updateNodeData(nodeId, {
    title,
    blocks,
    activeBlockId,
  });
}

const GroupNode = ({ id, data, selected }: { id: string; data: GroupNodeData; selected: boolean }) => {
  const { updateNodeData } = useStore();
  const title = data.title || 'Group #1';
  const blocks = migrateToBlocks(data);
  const activeBlockId = data.activeBlockId || blocks[0]?.id || null;
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const patchGroup = useCallback((patch: Partial<GroupNodeData>) => {
    syncNodeData(updateNodeData, id, patch.title ?? title, patch.blocks ?? blocks, patch.activeBlockId ?? activeBlockId);
  }, [activeBlockId, blocks, id, title, updateNodeData]);

  const addBlock = useCallback((sidebarType: string) => {
    const block = createDefaultBlock(sidebarType);
    if (!block) return;

    patchGroup({
      blocks: [...blocks, block],
      activeBlockId: block.id,
    });
    setShowAddMenu(false);
  }, [blocks, patchGroup]);

  const updateBlock = useCallback((blockId: string, partial: Partial<Block>) => {
    patchGroup({
      blocks: blocks.map((block) => (block.id === blockId ? ({ ...block, ...partial } as Block) : block)),
    });
  }, [blocks, patchGroup]);

  const duplicateGroup = useCallback(() => {
    const { addNode } = useStore.getState();
    const nextBlocks = blocks.map((block) => {
      const clone = createDefaultBlock(block.kind === 'input' ? `input_${block.type}` : block.type);
      if (!clone) return block;
      return { ...clone, ...block, id: clone.id };
    });

    addNode(
      'group',
      { x: 40, y: 40 },
      {
        title: `${title} Copy`,
        blocks: nextBlocks,
        activeBlockId: nextBlocks[0]?.id || null,
      }
    );
  }, [blocks, title]);

  const onBlockDragStart = useCallback((event: React.DragEvent, index: number) => {
    event.dataTransfer.setData('application/block-reorder', String(index));
    event.dataTransfer.effectAllowed = 'move';
    setDragIdx(index);
  }, []);

  const onZoneDragOver = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setDropIdx(index);
  }, []);

  const onZoneDrop = useCallback((event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    const sourceIndexRaw = event.dataTransfer.getData('application/block-reorder');
    const externalType = event.dataTransfer.getData('application/reactflow');

    if (sourceIndexRaw !== '') {
      const sourceIndex = Number.parseInt(sourceIndexRaw, 10);
      if (!Number.isNaN(sourceIndex) && sourceIndex !== targetIndex && sourceIndex !== targetIndex - 1) {
        const next = [...blocks];
          const [moved] = next.splice(sourceIndex, 1);
          const destination = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
          next.splice(destination, 0, moved);
          patchGroup({ blocks: next });
      }
    } else if (isSupportedSidebarType(externalType)) {
      const block = createDefaultBlock(externalType);
      if (block) {
        const next = [...blocks];
        next.splice(targetIndex, 0, block);
        patchGroup({ blocks: next, activeBlockId: block.id });
      }
    }

    setDragIdx(null);
    setDropIdx(null);
  }, [blocks, patchGroup]);

  const onGroupDragOver = useCallback((event: React.DragEvent) => {
    const hasSupportedType = event.dataTransfer.types.includes('application/reactflow');
    const isReordering = event.dataTransfer.types.includes('application/block-reorder');
    if (!hasSupportedType && !isReordering) return;

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setDropIdx(blocks.length);
  }, [blocks.length]);

  const onGroupDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const externalType = event.dataTransfer.getData('application/reactflow');
    if (isSupportedSidebarType(externalType)) {
      const block = createDefaultBlock(externalType);
      if (block) {
        patchGroup({
          blocks: [...blocks, block],
          activeBlockId: block.id,
        });
      }
    }

    setDragIdx(null);
    setDropIdx(null);
  }, [blocks, patchGroup]);

  const onDragEnd = useCallback(() => {
    setDragIdx(null);
    setDropIdx(null);
  }, []);

  return (
    <div
      className={`typebot-group w-[320px] ${selected ? 'selected' : ''}`}
      onDragOver={onGroupDragOver}
      onDrop={onGroupDrop}
      role="group"
      aria-label={`Group: ${title}`}
      tabIndex={0}
    >
      {selected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5 z-50 nodrag nopan">
          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors" title="Test group">
            <Play size={14} />
          </button>
          <button
            onClick={duplicateGroup}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            title="Duplicate group"
          >
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

      <Handle type="target" position={Position.Left} id="main-target" className="!-left-[6px]" style={{ top: 24 }} />

      <div className="typebot-group-header">
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(event) => patchGroup({ title: event.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setEditingTitle(false);
            }}
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

      <div className="flex flex-col pb-2">
        {blocks.map((block, index) => {
          const visuals = getVisuals(block);
          const isActive = activeBlockId === block.id;

          return (
            <React.Fragment key={block.id}>
              <div
                className={`typebot-dropzone ${dropIdx === index ? 'active' : ''}`}
                onDragOver={(event) => onZoneDragOver(event, index)}
                onDrop={(event) => onZoneDrop(event, index)}
                onDragLeave={() => setDropIdx(null)}
              />

              <div
                className={`typebot-block group/block ${dragIdx === index ? 'opacity-30' : ''} ${isActive ? 'ring-2 ring-orange-200 border-orange-300 bg-orange-50/40' : ''}`}
                draggable
                onDragStart={(event) => onBlockDragStart(event, index)}
                onDragEnd={onDragEnd}
                onClick={() => patchGroup({ activeBlockId: block.id })}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${visuals.bg}`}>
                    <visuals.icon size={12} className={visuals.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-slate-700">{getBlockLabel(block)}</span>
                      {block.kind === 'input' && (
                        <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide">
                          {block.validation.required ? 'Required' : 'Optional'}
                        </span>
                      )}
                    </div>
                    <BlockContent block={block} onUpdate={(partial) => updateBlock(block.id, partial)} />
                  </div>
                </div>

                <Handle
                  type="source"
                  position={Position.Right}
                  id={`handle-${block.id}`}
                  className="!-right-[6px]"
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </React.Fragment>
          );
        })}

        <div
          className={`typebot-dropzone ${dropIdx === blocks.length ? 'active' : ''}`}
          onDragOver={(event) => onZoneDragOver(event, blocks.length)}
          onDrop={(event) => onZoneDrop(event, blocks.length)}
          onDragLeave={() => setDropIdx(null)}
        />
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowAddMenu((value) => !value)}
          className="nodrag nopan w-full flex items-center justify-center gap-1.5 py-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50/60 transition-all text-[11px] font-medium border-t border-gray-100"
        >
          <Plus size={14} />
          <span>Add block</span>
        </button>
        {showAddMenu && <AddBlockMenu onAdd={addBlock} />}
      </div>

      {blocks.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="main-source"
          className="!-right-[6px]"
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />
      )}
    </div>
  );
};

const BlockContent = ({ block, onUpdate }: { block: Block; onUpdate: (partial: Partial<Block>) => void }) => {
  if (block.kind === 'bubble') {
    const bubble = block as BubbleBlock;

    if (bubble.type === 'text') {
      return (
        <textarea
          value={bubble.content}
          onChange={(event) => onUpdate({ content: event.target.value })}
          placeholder="Write the message shown to the user..."
          className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] text-gray-600 placeholder:text-gray-400 resize-none min-h-[18px] outline-none leading-snug"
          onInput={(event) => {
            const target = event.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${target.scrollHeight}px`;
          }}
          rows={1}
        />
      );
    }

    return (
      <input
        value={bubble.content}
        onChange={(event) => onUpdate({ content: event.target.value })}
        placeholder={`Paste a ${bubble.type} URL...`}
        className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] text-gray-500 placeholder:text-gray-400 outline-none"
      />
    );
  }

  const input = block as InputBlock;

  return (
    <div className="space-y-1">
      <input
        value={input.prompt}
        onChange={(event) => onUpdate({ prompt: event.target.value })}
        placeholder="Question shown before this input"
        className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] font-medium text-slate-600 placeholder:text-slate-400 outline-none"
      />
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <span className="truncate text-slate-400">Variable: {input.variable}</span>
        <span className="text-slate-400">{input.buttonLabel}</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        {input.validation.required ? (
          <CheckCircle2 size={11} className="text-emerald-500" />
        ) : (
          <AlertCircle size={11} className="text-amber-500" />
        )}
        <span className="truncate">{input.placeholder}</span>
      </div>
    </div>
  );
};

const MENU_SECTIONS = [
  {
    title: 'Bubbles',
    items: [
      { id: 'text', label: 'Text', icon: MessageSquare, color: 'text-blue-500' },
      { id: 'image', label: 'Image', icon: ImageIcon, color: 'text-purple-500' },
      { id: 'video', label: 'Video', icon: Video, color: 'text-indigo-500' },
      { id: 'audio', label: 'Audio', icon: Mic, color: 'text-emerald-500' },
      { id: 'embed', label: 'Embed', icon: FileText, color: 'text-slate-500' },
    ],
  },
  {
    title: 'Inputs',
    items: [
      { id: 'input_text', label: 'Text', icon: TypeIcon, color: 'text-orange-500' },
      { id: 'input_number', label: 'Number', icon: Hash, color: 'text-orange-500' },
      { id: 'input_email', label: 'Email', icon: Mail, color: 'text-orange-500' },
      { id: 'input_phone', label: 'Phone', icon: Phone, color: 'text-orange-500' },
      { id: 'input_date', label: 'Date', icon: Calendar, color: 'text-orange-500' },
    ],
  },
];

const AddBlockMenu = ({ onAdd }: { onAdd: (type: string) => void }) => (
  <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
    <div className="p-2">
      {MENU_SECTIONS.map((section) => (
        <div key={section.title} className="first:mt-0 mt-1">
          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
            {section.title}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onAdd(item.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <item.icon size={14} className={item.color} />
                <span className="text-[9px] text-gray-500 font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default GroupNode;
