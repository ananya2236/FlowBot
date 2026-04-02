"use client";
import React, { useMemo, useEffect, useCallback, useState } from 'react';
import {
  Trash2,
  X,
  Layers3,
  MessageSquare,
  Keyboard,
  GitBranch,
  ArrowRight,
  Code2,
  ChevronDown,
  AlertTriangle,
  GripVertical,
  Info,
  Hash,
} from 'lucide-react';
import useStore from '@/lib/store';
import {
  Block,
  BubbleBlock,
  ConditionBlock,
  ConditionOperator,
  GroupNodeData,
  InputBlock,
  InputChoice,
  FileSource,
  LogicBlock,
  RedirectBlock,
  SetVariableBlock,
  formatVariableName,
  getBlockLabel,
  getBubbleAttachmentUrl,
  getBlockSummary,
  migrateToBlocks,
} from '@/lib/blocks';

const CONDITION_OPERATORS: Array<{ value: ConditionOperator; label: string }> = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'not_empty', label: 'Is not empty' },
];

function updateGroupNode(
  updateNodeData: (nodeId: string, data: Partial<GroupNodeData>) => void,
  nodeId: string,
  groupTitle: string,
  blocks: Block[],
  activeBlockId: string | null
) {
  updateNodeData(nodeId, { title: groupTitle, blocks, activeBlockId });
}

function getBlockIcon(block: Block): React.ReactNode {
  if (block.kind === 'bubble') return <MessageSquare size={14} />;
  if (block.kind === 'input') return <Keyboard size={14} />;
  if (block.type === 'condition') return <GitBranch size={14} />;
  if (block.type === 'redirect') return <ArrowRight size={14} />;
  return <Code2 size={14} />;
}

function getBlockKindStyle(kind: string) {
  if (kind === 'bubble') return { text: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/60' };
  if (kind === 'input') return { text: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/60' };
  return { text: 'text-violet-600', bg: 'bg-violet-50', dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200/60' };
}

export default function NodeEditor() {
  const { bots, activeBotId, editorNodeId, setEditorNodeId, updateNodeData, setNodes } = useStore();
  const activeBot = bots.find((bot) => bot.id === activeBotId);
  const nodes = activeBot?.nodes || [];
  const selectedNode = editorNodeId ? nodes.find((node) => node.id === editorNodeId) || null : null;
  const isOpen = !!selectedNode;

  const close = useCallback(() => setEditorNodeId(null), [setEditorNodeId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  const details = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'group') return null;
    const data = selectedNode.data as GroupNodeData;
    const blocks = migrateToBlocks(data);
    const activeBlockId = data.activeBlockId || blocks[0]?.id || null;
    const activeBlock = blocks.find((b) => b.id === activeBlockId) || null;
    return { data, blocks, activeBlockId, activeBlock };
  }, [selectedNode]);

  const deleteNode = () => {
    if (!selectedNode || selectedNode.id === 'start') return;
    close();
    setNodes(nodes.filter((n) => n.id !== selectedNode.id));
  };

  const patchGroup = (patch: Partial<GroupNodeData>) => {
    if (!selectedNode || selectedNode.type !== 'group' || !details) return;
    updateGroupNode(updateNodeData, selectedNode.id, patch.title ?? details.data.title, patch.blocks ?? details.blocks, patch.activeBlockId ?? details.activeBlockId);
  };

  const patchBlock = (blockId: string, partial: Partial<Block>) => {
    if (!details) return;
    patchGroup({ blocks: details.blocks.map((b) => (b.id === blockId ? ({ ...b, ...partial } as Block) : b)) });
  };

  const deleteBlock = (blockId: string) => {
    if (!details) return;
    const next = details.blocks.filter((b) => b.id !== blockId);
    patchGroup({ blocks: next, activeBlockId: next[0]?.id || null });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(15, 23, 42, 0.04)', backdropFilter: 'blur(1px)' }}
        onClick={close}
      />

      {/* Panel */}
      <aside
        className="editor-panel fixed top-0 right-0 h-full w-[400px] bg-white z-50 flex flex-col"
        style={{
          boxShadow: '-8px 0 32px rgba(0,0,0,0.06), -1px 0 0 rgba(226,232,240,0.8)',
          animation: 'panel-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 text-white shrink-0 shadow-sm">
              <Layers3 size={15} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-slate-900 truncate leading-tight">
                {selectedNode?.id === 'start' ? 'Start Node' : (details?.data.title || 'Group Settings')}
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                {selectedNode?.id === 'start' ? 'Entry point' : `${details?.blocks.length ?? 0} blocks`}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto editor-panel-scrollbar">
          {selectedNode?.id === 'start' ? (
            <div className="p-5">
              <div className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 p-4">
                <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[13px] leading-relaxed text-slate-600">
                  Connect the start node to the first group. The preview engine begins execution from that first edge.
                </p>
              </div>
            </div>
          ) : details ? (
            <div>
              {/* ── General Section ── */}
              <Section title="General" icon={<Hash size={13} />} defaultOpen>
                <div className="space-y-4">
                  <Field label="Group title">
                    <input
                      value={details.data.title}
                      onChange={(e) => patchGroup({ title: e.target.value })}
                      className={inputClass}
                      placeholder="Untitled group"
                    />
                  </Field>

                  <div className="grid grid-cols-3 gap-2">
                    <StatCard label="Blocks" value={details.blocks.length} color="slate" />
                    <StatCard label="Inputs" value={details.blocks.filter((b) => b.kind === 'input').length} color="amber" />
                    <StatCard label="Logic" value={details.blocks.filter((b) => b.kind === 'logic').length} color="violet" />
                  </div>
                </div>
              </Section>

              {/* ── Block List ── */}
              <Section
                title="Blocks"
                icon={<Layers3 size={13} />}
                count={details.blocks.length}
                defaultOpen
              >
                <div className="space-y-0.5">
                  {details.blocks.map((block) => {
                    const style = getBlockKindStyle(block.kind);
                    const isActive = details.activeBlockId === block.id;
                    return (
                      <button
                        key={block.id}
                        onClick={() => patchGroup({ activeBlockId: block.id })}
                        className={`w-full group/item flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all ${
                          isActive
                            ? 'bg-orange-50/80 ring-1 ring-orange-200'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-slate-300 group-hover/item:text-slate-400 transition-colors">
                          <GripVertical size={12} />
                        </span>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-md shrink-0 ${style.bg} ${style.text}`}>
                          {getBlockIcon(block)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-[12px] font-medium truncate leading-tight ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                            {getBlockLabel(block)}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate leading-tight">
                            {getBlockSummary(block)}
                          </div>
                        </div>
                        <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${style.badge}`}>
                          {block.kind}
                        </span>
                      </button>
                    );
                  })}
                  {details.blocks.length === 0 && (
                    <p className="text-[12px] text-slate-400 text-center py-4">
                      Drag blocks from the sidebar to add them.
                    </p>
                  )}
                </div>
              </Section>

              {/* ── Active Block Config ── */}
              {details.activeBlock && (
                <Section
                  title={getBlockLabel(details.activeBlock)}
                  subtitle={
                    details.activeBlock.kind === 'bubble' ? 'Message' : details.activeBlock.kind === 'input' ? 'Input' : 'Logic'
                  }
                  defaultOpen
                >
                  {details.activeBlock.kind === 'bubble' ? (
                    <BubbleSettings block={details.activeBlock as BubbleBlock} onChange={(p) => patchBlock(details.activeBlock!.id, p)} />
                  ) : details.activeBlock.kind === 'input' ? (
                    <InputSettings block={details.activeBlock as InputBlock} onChange={(p) => patchBlock(details.activeBlock!.id, p)} />
                  ) : (
                    <LogicSettings block={details.activeBlock as LogicBlock} onChange={(p) => patchBlock(details.activeBlock!.id, p)} />
                  )}
                </Section>
              )}
            </div>
          ) : null}
        </div>

        {/* ── Footer ── */}
        {selectedNode && selectedNode.id !== 'start' && (
          <div className="border-t border-slate-100 px-4 py-2.5 shrink-0 flex items-center justify-between gap-2">
            {details?.activeBlock && (
              <button
                onClick={() => deleteBlock(details.activeBlock!.id)}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={12} />
                Remove block
              </button>
            )}
            <button
              onClick={deleteNode}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ml-auto"
            >
              <Trash2 size={12} />
              Delete group
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════ */

function Section({
  title,
  subtitle,
  icon,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-5 py-3 hover:bg-slate-50/50 transition-colors"
      >
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 min-w-[20px] text-center px-1.5 py-0.5 rounded-full">{count}</span>
        )}
        {subtitle && <span className="text-[10px] text-slate-400 font-medium">{subtitle}</span>}
      </button>
      {open && (
        <div className="px-5 pb-4 section-content-enter">
          {children}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-100',
    amber: 'bg-amber-50/50 border-amber-100/60',
    violet: 'bg-violet-50/50 border-violet-100/60',
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${colors[color] || colors.slate}`}>
      <div className="text-base font-bold text-slate-800 leading-none">{value}</div>
      <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-medium text-slate-500">{label}</span>
    {children}
  </label>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 text-[12px] leading-relaxed text-amber-700 flex items-start gap-2">
    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
    <div>{children}</div>
  </div>
);

/* ─── Block editors ─── */

const inputClass = "w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function getMediaAcceptTypes(type: BubbleBlock['type']) {
  if (type === 'image') return 'image/*';
  if (type === 'video') return 'video/*';
  if (type === 'audio') return 'audio/*';
  return '';
}

const BubbleSettings = ({ block, onChange }: { block: BubbleBlock; onChange: (p: Partial<BubbleBlock>) => void }) => {
  const deviceInputRef = React.useRef<HTMLInputElement>(null);
  const attachmentUrl = getBubbleAttachmentUrl(block);
  const isMediaBlock = block.type !== 'text';
  const sourceLabel =
    block.attachmentSource === 'device'
      ? 'Device file'
      : block.attachmentSource === 'drive'
        ? 'Drive link'
        : 'Direct link';

  const attachFromDevice = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;

      onChange({
        content: dataUrl,
        attachmentSource: 'device',
        attachmentUrl: dataUrl,
        attachmentName: file.name,
        attachmentMimeType: file.type,
        driveLink: '',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <Field label="Content">
        {block.type === 'text' ? (
          <textarea
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={4}
            className={inputClass + " resize-none"}
            placeholder="Write the message your bot should send..."
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => deviceInputRef.current?.click()}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600"
              >
                Device
              </button>
              <button
                type="button"
                onClick={() => onChange({ attachmentSource: 'drive' })}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600"
              >
                Drive
              </button>
              <button
                type="button"
                onClick={() => onChange({ attachmentSource: 'link' })}
                className="rounded-md border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-orange-300 hover:text-orange-600"
              >
                Link
              </button>
            </div>

            <input
              ref={deviceInputRef}
              type="file"
              accept={getMediaAcceptTypes(block.type)}
              className="hidden"
              onChange={attachFromDevice}
            />

            {block.attachmentSource === 'drive' ? (
              <input
                value={block.driveLink || ''}
                onChange={(event) =>
                  onChange({
                    driveLink: event.target.value,
                    content: event.target.value,
                    attachmentSource: 'drive',
                    attachmentUrl: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Paste Google Drive / OneDrive file link"
              />
            ) : (
              <input
                value={attachmentUrl}
                onChange={(event) =>
                  onChange({
                    content: event.target.value,
                    attachmentSource: 'link',
                    attachmentUrl: event.target.value,
                    driveLink: '',
                  })
                }
                className={inputClass}
                placeholder={`Paste a ${block.type} URL`}
              />
            )}

            {isMediaBlock ? (
              <div className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                <span>Source: {sourceLabel}</span>
                {block.attachmentName ? <span className="truncate max-w-[170px]">{block.attachmentName}</span> : null}
              </div>
            ) : null}
          </div>
        )}
      </Field>
    </div>
  );
};

const InputSettings = ({ block, onChange }: { block: InputBlock; onChange: (p: Partial<InputBlock>) => void }) => (
  <div className="space-y-3">
    <Field label="Prompt">
      <textarea
        value={block.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        rows={2}
        className={inputClass + " resize-none"}
        placeholder="Ask the user for the information you need"
      />
    </Field>

    <div className="grid grid-cols-2 gap-2">
      <Field label="Variable">
        <input value={block.variable} onChange={(e) => onChange({ variable: formatVariableName(e.target.value) })} className={inputClass} placeholder="customer_email" />
      </Field>
      <Field label="Button label">
        <input value={block.buttonLabel} onChange={(e) => onChange({ buttonLabel: e.target.value })} className={inputClass} placeholder="Continue" />
      </Field>
    </div>

    <Field label="Placeholder">
      <input value={block.placeholder} onChange={(e) => onChange({ placeholder: e.target.value })} className={inputClass} placeholder="Enter your answer" />
    </Field>

    {(block.type === 'buttons' || block.type === 'pic_choice' || block.type === 'cards') && (
      <Field label="Options">
        <OptionEditor options={block.options || []} onChange={(options) => onChange({ options })} />
      </Field>
    )}

    {block.type === 'rating' && (
      <Field label="Rating scale">
        <input type="number" min={2} max={10} value={block.ratingScale ?? 5} onChange={(e) => onChange({ ratingScale: e.target.value ? Number(e.target.value) : 5 })} className={inputClass} />
      </Field>
    )}

    {block.type === 'payment' && (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Currency">
            <input value={block.currency ?? 'USD'} onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })} className={inputClass} placeholder="USD" />
          </Field>
          <Field label="Amount">
            <input type="number" value={block.amount ?? 99} onChange={(e) => onChange({ amount: e.target.value ? Number(e.target.value) : 0 })} className={inputClass} />
          </Field>
        </div>
        <Field label="Payment methods">
          <OptionEditor options={block.paymentMethods || []} onChange={(paymentMethods) => onChange({ paymentMethods })} />
        </Field>
      </div>
    )}

    {block.type === 'file' && (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="File types">
            <input value={block.acceptedFileTypes ?? '.pdf,.doc,.jpg,.png'} onChange={(e) => onChange({ acceptedFileTypes: e.target.value })} className={inputClass} placeholder=".pdf,.doc,.png" />
          </Field>
          <Field label="Max size (MB)">
            <input type="number" value={block.maxFileSizeMb ?? 10} onChange={(e) => onChange({ maxFileSizeMb: e.target.value ? Number(e.target.value) : 10 })} className={inputClass} />
          </Field>
        </div>
        <FieldGroup title="File sources">
          {(['device', 'cloudLink'] as const).map((src) => (
            <label key={src} className="flex items-center gap-2 text-[12px] text-slate-700">
              <input
                type="checkbox"
                checked={(block.fileSources || []).includes(src)}
                onChange={(e) => {
                  const s = new Set(block.fileSources || []);
                  if (e.target.checked) s.add(src); else s.delete(src);
                  onChange({ fileSources: Array.from(s) as FileSource[] });
                }}
                className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 h-3.5 w-3.5"
              />
              {src === 'device' ? 'Device upload' : 'Cloud / Drive link'}
            </label>
          ))}
          <label className="flex items-center gap-2 text-[12px] text-slate-700">
            <input type="checkbox" checked={!!block.allowMultipleFiles} onChange={(e) => onChange({ allowMultipleFiles: e.target.checked })} className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 h-3.5 w-3.5" />
            Allow multiple files
          </label>
        </FieldGroup>
      </div>
    )}

    {block.type === 'phone' && (
      <div className="grid grid-cols-3 gap-2">
        <Field label="Country"><input value={block.phoneCountryCode ?? '+91'} onChange={(e) => onChange({ phoneCountryCode: e.target.value })} className={inputClass} /></Field>
        <Field label="Min digits"><input type="number" value={block.phoneMinDigits ?? 10} onChange={(e) => onChange({ phoneMinDigits: e.target.value ? Number(e.target.value) : 7 })} className={inputClass} /></Field>
        <Field label="Max digits"><input type="number" value={block.phoneMaxDigits ?? 10} onChange={(e) => onChange({ phoneMaxDigits: e.target.value ? Number(e.target.value) : 15 })} className={inputClass} /></Field>
      </div>
    )}

    {/* Validation */}
    <FieldGroup
      title="Validation"
      trailing={
        <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={block.validation.required}
            onChange={(e) => onChange({ validation: { ...block.validation, required: e.target.checked } })}
            className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 h-3.5 w-3.5"
          />
          Required
        </label>
      }
    >
      {block.type === 'text' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min length"><input type="number" value={block.validation.minLength ?? ''} onChange={(e) => onChange({ validation: { ...block.validation, minLength: e.target.value ? Number(e.target.value) : undefined } })} className={inputClass} /></Field>
          <Field label="Max length"><input type="number" value={block.validation.maxLength ?? ''} onChange={(e) => onChange({ validation: { ...block.validation, maxLength: e.target.value ? Number(e.target.value) : undefined } })} className={inputClass} /></Field>
        </div>
      )}

      {(block.type === 'number' || block.type === 'rating') && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Min"><input type="number" value={block.validation.min ?? ''} onChange={(e) => onChange({ validation: { ...block.validation, min: e.target.value ? Number(e.target.value) : undefined } })} className={inputClass} /></Field>
          <Field label="Max"><input type="number" value={block.validation.max ?? ''} onChange={(e) => onChange({ validation: { ...block.validation, max: e.target.value ? Number(e.target.value) : undefined } })} className={inputClass} /></Field>
        </div>
      )}

      <Field label="Error message">
        <input value={block.validation.customError ?? ''} onChange={(e) => onChange({ validation: { ...block.validation, customError: e.target.value || undefined } })} className={inputClass} placeholder="Custom error shown to user" />
      </Field>
    </FieldGroup>
  </div>
);

const OptionEditor = ({ options, onChange }: { options: InputChoice[]; onChange: (o: InputChoice[]) => void }) => (
  <div className="space-y-1.5">
    {options.map((opt) => (
      <div key={opt.id} className="flex items-center gap-1.5">
        <input
          value={opt.label}
          onChange={(e) => onChange(options.map((o) => o.id === opt.id ? { ...o, label: e.target.value, value: formatVariableName(e.target.value) } : o))}
          className={inputClass}
          placeholder="Option label"
        />
        <button onClick={() => onChange(options.filter((o) => o.id !== opt.id))} className="shrink-0 rounded-md p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <X size={12} />
        </button>
      </div>
    ))}
    <button
      onClick={() => onChange([...options, { id: `opt_${Date.now()}`, label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` }])}
      className="w-full rounded-md border border-dashed border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:border-orange-300 hover:text-orange-500 transition-colors"
    >
      + Add option
    </button>
  </div>
);

const FieldGroup = ({ title, trailing, children }: { title: string; trailing?: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-150 bg-slate-50/60 p-3 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-slate-500">{title}</span>
      {trailing}
    </div>
    {children}
  </div>
);

const LogicSettings = ({ block, onChange }: { block: LogicBlock; onChange: (p: Partial<LogicBlock>) => void }) => {
  if (block.type === 'set_variable') {
    const sv = block as SetVariableBlock;
    return (
      <div className="space-y-3">
        <Field label="Variable name"><input value={sv.variable} onChange={(e) => onChange({ variable: formatVariableName(e.target.value) })} className={inputClass} placeholder="status" /></Field>
        <Field label="Value"><input value={sv.value} onChange={(e) => onChange({ value: e.target.value })} className={inputClass} placeholder="qualified" /></Field>
        <Hint>Stores a value in preview runtime. Reference with <span className="font-mono text-[11px]">{'{{variable}}'}</span>.</Hint>
      </div>
    );
  }

  if (block.type === 'condition') {
    const c = block as ConditionBlock;
    const isUnary = c.operator === 'is_empty' || c.operator === 'not_empty';
    return (
      <div className="space-y-3">
        <Field label="Variable"><input value={c.variable} onChange={(e) => onChange({ variable: formatVariableName(e.target.value) })} className={inputClass} placeholder="status" /></Field>
        <Field label="Operator">
          <select value={c.operator} onChange={(e) => onChange({ operator: e.target.value as ConditionOperator })} className={inputClass}>
            {CONDITION_OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>
        </Field>
        {!isUnary && <Field label="Compare with"><input value={c.value} onChange={(e) => onChange({ value: e.target.value })} className={inputClass} placeholder="qualified" /></Field>}
        <div className="grid grid-cols-2 gap-2">
          <Field label="True label"><input value={c.trueLabel} onChange={(e) => onChange({ trueLabel: e.target.value })} className={inputClass} /></Field>
          <Field label="False label"><input value={c.falseLabel} onChange={(e) => onChange({ falseLabel: e.target.value })} className={inputClass} /></Field>
        </div>
        <Hint>Connect the condition handles on the canvas to branch flow.</Hint>
      </div>
    );
  }

  const r = block as RedirectBlock;
  return (
    <div className="space-y-3">
      <Field label="Label"><input value={r.label} onChange={(e) => onChange({ label: e.target.value })} className={inputClass} placeholder="Go to group" /></Field>
      <Hint>Connect to another group. Preview will follow that edge.</Hint>
    </div>
  );
};
