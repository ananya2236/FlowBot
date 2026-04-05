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
  Globe,
  Clock3,
  ListChecks,
  LayoutGrid,
  CreditCard,
  Star,
  Upload,
  SquareStack,
  Type as TypeIcon,
  Play,
  Copy,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Code2,
  ArrowRight,
  Settings2,
  Timer,
  Shuffle,
  CornerDownRight,
  CornerUpLeft,
  Flag,
  Command,
  Reply,
  XCircle,
  Sheet,
  BarChart3,
  Zap,
  Send,
} from 'lucide-react';
import {
  Block,
  BubbleBlock,
  ConditionBlock,
  GroupNodeData,
  InputBlock,
  LogicBlock,
  createDefaultBlock,
  getBlockHandleId,
  getBlockLabel,
  getBubbleAttachmentUrl,
  getBlockSummary,
  getInputBranchKey,
  getInputBranches,
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
  input_website: { icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_time: { icon: Clock3, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_buttons: { icon: ListChecks, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_pic_choice: { icon: LayoutGrid, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_payment: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_rating: { icon: Star, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_file: { icon: Upload, color: 'text-orange-600', bg: 'bg-orange-50' },
  input_cards: { icon: SquareStack, color: 'text-orange-600', bg: 'bg-orange-50' },
  logic_set_variable: { icon: Code2, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  logic_condition: { icon: GitBranch, color: 'text-violet-600', bg: 'bg-violet-50' },
  logic_redirect: { icon: ArrowRight, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_script: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_typebot: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_wait: { icon: Timer, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_ab_test: { icon: Shuffle, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_webhook: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_jump: { icon: CornerDownRight, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_return: { icon: CornerUpLeft, color: 'text-purple-600', bg: 'bg-purple-50' },
  logic_start: { icon: Flag, color: 'text-slate-600', bg: 'bg-slate-100' },
  logic_command: { icon: Command, color: 'text-slate-600', bg: 'bg-slate-100' },
  logic_reply: { icon: Reply, color: 'text-slate-600', bg: 'bg-slate-100' },
  logic_invalid: { icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
  logic_sheets: { icon: Sheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  logic_analytics: { icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
  logic_http_request: { icon: Zap, color: 'text-sky-600', bg: 'bg-sky-50' },
  logic_send_email: { icon: Send, color: 'text-sky-600', bg: 'bg-sky-50' },
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
      { id: 'input_website', label: 'Website', icon: Globe, color: 'text-orange-500' },
      { id: 'input_phone', label: 'Phone', icon: Phone, color: 'text-orange-500' },
      { id: 'input_date', label: 'Date', icon: Calendar, color: 'text-orange-500' },
      { id: 'input_time', label: 'Time', icon: Clock3, color: 'text-orange-500' },
      { id: 'input_buttons', label: 'Buttons', icon: ListChecks, color: 'text-orange-500' },
      { id: 'input_pic_choice', label: 'Pic choice', icon: LayoutGrid, color: 'text-orange-500' },
      { id: 'input_payment', label: 'Payment', icon: CreditCard, color: 'text-orange-500' },
      { id: 'input_rating', label: 'Rating', icon: Star, color: 'text-orange-500' },
      { id: 'input_file', label: 'File', icon: Upload, color: 'text-orange-500' },
      { id: 'input_cards', label: 'Cards', icon: SquareStack, color: 'text-orange-500' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { id: 'logic_set_variable', label: 'Set variable', icon: Code2, color: 'text-fuchsia-500' },
      { id: 'logic_condition', label: 'Condition', icon: GitBranch, color: 'text-violet-500' },
      { id: 'logic_redirect', label: 'Redirect', icon: ArrowRight, color: 'text-purple-500' },
      { id: 'logic_script', label: 'Script', icon: FileText, color: 'text-purple-500' },
      { id: 'logic_typebot', label: 'Typebot', icon: MessageSquare, color: 'text-purple-500' },
      { id: 'logic_wait', label: 'Wait', icon: Timer, color: 'text-purple-500' },
      { id: 'logic_ab_test', label: 'AB test', icon: Shuffle, color: 'text-purple-500' },
      { id: 'logic_webhook', label: 'Webhook', icon: Zap, color: 'text-purple-500' },
      { id: 'logic_jump', label: 'Jump', icon: CornerDownRight, color: 'text-purple-500' },
      { id: 'logic_return', label: 'Return', icon: CornerUpLeft, color: 'text-purple-500' },
    ],
  },
  {
    title: 'Events',
    items: [
      { id: 'event_start', label: 'Start', icon: Flag, color: 'text-slate-500' },
      { id: 'event_command', label: 'Command', icon: Command, color: 'text-slate-500' },
      { id: 'event_reply', label: 'Reply', icon: Reply, color: 'text-slate-500' },
      { id: 'event_invalid', label: 'Invalid', icon: XCircle, color: 'text-slate-500' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { id: 'integration_sheets', label: 'Sheets', icon: Sheet, color: 'text-emerald-500' },
      { id: 'integration_analytics', label: 'Analytics', icon: BarChart3, color: 'text-amber-500' },
      { id: 'integration_webhook', label: 'HTTP req', icon: Zap, color: 'text-sky-500' },
      { id: 'integration_email', label: 'Email', icon: Send, color: 'text-sky-500' },
    ],
  },
];

function getVisuals(block: Block) {
  if (block.kind === 'bubble') return BLOCK_TYPES[block.type] || BLOCK_TYPES.text;
  if (block.kind === 'input') return BLOCK_TYPES[`input_${block.type}`] || BLOCK_TYPES.input_text;
  return BLOCK_TYPES[`logic_${block.type}`] || BLOCK_TYPES.logic_redirect;
}

function syncNodeData(
  updateNodeData: (nodeId: string, data: Partial<GroupNodeData>) => void,
  nodeId: string,
  title: string,
  blocks: Block[],
  activeBlockId: string | null
) {
  updateNodeData(nodeId, { title, blocks, activeBlockId });
}

function getBlockHandles(block: Block) {
  if (block.kind === 'logic' && block.type === 'condition') {
    const condition = block as ConditionBlock;
    return [
      { id: getBlockHandleId(block.id, 'true'), label: condition.trueLabel || 'True', top: '35%' },
      { id: getBlockHandleId(block.id, 'false'), label: condition.falseLabel || 'False', top: '68%' },
    ];
  }

  if (block.kind === 'input') {
    const input = block as InputBlock;
    const branches = getInputBranches(input);
    if (branches.length) {
      const step = 100 / (branches.length + 1);
      return branches.map((branch, index) => ({
        id: getBlockHandleId(block.id, getInputBranchKey(branch.value)),
        label: branch.label,
        top: `${Math.round(step * (index + 1))}%`,
      }));
    }
  }

  return [{ id: getBlockHandleId(block.id), label: '', top: '50%' }];
}

const GroupNode = ({ id, data, selected }: { id: string; data: GroupNodeData; selected: boolean }) => {
  const { updateNodeData, previewNodeId } = useStore();
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
    syncNodeData(
      updateNodeData,
      id,
      patch.title ?? title,
      patch.blocks ?? blocks,
      patch.activeBlockId ?? activeBlockId
    );
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
      const sourceType =
        block.kind === 'bubble'
          ? block.type
          : block.kind === 'input'
            ? `input_${block.type}`
            : `logic_${block.type}`;
      const clone = createDefaultBlock(sourceType);
      if (!clone) return block;
      return { ...clone, ...block, id: clone.id };
    });

    addNode('group', { x: 40, y: 40 }, {
      title: `${title} Copy`,
      blocks: nextBlocks,
      activeBlockId: nextBlocks[0]?.id || null,
    });
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

  const isPreviewActive = previewNodeId === id;

  return (
    <div
      className={`typebot-group w-[340px] ${selected ? 'selected' : ''} ${isPreviewActive ? 'preview-active' : ''}`}
      onDragOver={onGroupDragOver}
      onDrop={onGroupDrop}
      role="group"
      aria-label={`Group: ${title}`}
      tabIndex={0}
    >
      {selected && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1 z-50 nodrag nopan"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)' }}
        >
          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors" title="Test group">
            <Play size={13} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              const { editorNodeId, setEditorNodeId } = useStore.getState();
              setEditorNodeId(editorNodeId === id ? null : id);
            }}
            className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
            title="Settings"
          >
            <Settings2 size={13} />
          </button>
          <div className="w-px h-4 bg-slate-150 mx-0.5" />
          <button
            onClick={duplicateGroup}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
            title="Duplicate group"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => {
              const { onNodesChange } = useStore.getState();
              onNodesChange([{ type: 'remove', id }]);
            }}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Delete group"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="main-target"
        className="!-left-[6px]"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />

      <div className="typebot-group-header flex items-center gap-1">
        <div className="flex-1 min-w-0">
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
      </div>

      <div className="flex flex-col pb-2">
        {blocks.map((block, index) => {
          const visuals = getVisuals(block);
          const isActive = activeBlockId === block.id;
          const handles = getBlockHandles(block);

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

                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[11px] font-semibold text-slate-700">{getBlockLabel(block)}</span>
                      {block.kind === 'input' && (
                        <span className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide">
                          {(block as InputBlock).validation.required ? 'Required' : 'Optional'}
                        </span>
                      )}
                      {block.kind === 'logic' && (
                        <span className="text-[10px] text-violet-600 font-semibold uppercase tracking-wide">
                          Logic
                        </span>
                      )}
                    </div>
                    <BlockContent block={block} onUpdate={(partial) => updateBlock(block.id, partial)} />
                  </div>
                </div>

                {handles.map((handle) => (
                  <React.Fragment key={handle.id}>
                    {handle.label ? (
                      <span
                        className="absolute right-4 text-[9px] font-semibold uppercase tracking-wide text-slate-400"
                        style={{ top: handle.top }}
                      >
                        {handle.label}
                      </span>
                    ) : null}
                    <Handle
                      type="source"
                      position={Position.Right}
                      id={handle.id}
                      className="!-right-[6px]"
                      style={{ top: handle.top, transform: 'translateY(-50%)' }}
                    />
                  </React.Fragment>
                ))}
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
        value={getBubbleAttachmentUrl(bubble)}
        onChange={(event) =>
          onUpdate({
            content: event.target.value,
            attachmentSource: 'link',
            attachmentUrl: event.target.value,
            driveLink: '',
          })
        }
        placeholder={`Paste a ${bubble.type} link...`}
        className="nodrag nopan w-full bg-transparent border-none p-0 text-[12px] text-gray-500 placeholder:text-gray-400 outline-none"
      />
    );
  }

  if (block.kind === 'input') {
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
        {input.options?.length ? (
          <div className="flex flex-wrap gap-1">
            {input.options.slice(0, 3).map((option) => (
              <span key={option.id} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
                {option.label}
              </span>
            ))}
          </div>
        ) : null}
        {input.type === 'payment' ? (
          <div className="text-[10px] text-slate-400">
            {input.currency} {input.amount}
          </div>
        ) : null}
      </div>
    );
  }

  const logic = block as LogicBlock;

  return (
    <div className="space-y-1">
      <div className="text-[12px] font-medium text-slate-600">{getBlockSummary(logic)}</div>
      {logic.type === 'condition' ? (
        <div className="flex items-center gap-2 text-[10px] text-violet-500">
          <span>{logic.trueLabel}</span>
          <span>/</span>
          <span>{logic.falseLabel}</span>
        </div>
      ) : (
        <div className="text-[10px] text-slate-400">
          {logic.type === 'set_variable' ? 'Updates preview variables' : 'Follows the connected path'}
        </div>
      )}
    </div>
  );
};

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
