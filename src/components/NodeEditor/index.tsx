"use client";
import React, { useMemo } from 'react';
import { Trash2, Settings2, Layers3, MessageSquare, Keyboard } from 'lucide-react';
import useStore from '@/lib/store';
import {
  Block,
  BubbleBlock,
  GroupNodeData,
  InputBlock,
  formatVariableName,
  getBlockLabel,
  migrateToBlocks,
} from '@/lib/blocks';

function updateGroupNode(
  updateNodeData: (nodeId: string, data: Partial<GroupNodeData>) => void,
  nodeId: string,
  groupTitle: string,
  blocks: Block[],
  activeBlockId: string | null
) {
  updateNodeData(nodeId, {
    title: groupTitle,
    blocks,
    activeBlockId,
  });
}

export default function NodeEditor() {
  const { bots, activeBotId, updateNodeData, setNodes } = useStore();
  const activeBot = bots.find((bot) => bot.id === activeBotId);
  const nodes = activeBot?.nodes || [];
  const selectedNode = nodes.find((node) => node.selected) || null;

  const details = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'group') return null;

    const data = selectedNode.data as GroupNodeData;
    const blocks = migrateToBlocks(data);
    const activeBlockId = data.activeBlockId || blocks[0]?.id || null;
    const activeBlock = blocks.find((block) => block.id === activeBlockId) || null;

    return {
      data,
      blocks,
      activeBlockId,
      activeBlock,
    };
  }, [selectedNode]);

  const deleteNode = () => {
    if (!selectedNode || selectedNode.id === 'start') return;
    setNodes(nodes.filter((node) => node.id !== selectedNode.id));
  };

  const patchGroup = (patch: Partial<GroupNodeData>) => {
    if (!selectedNode || selectedNode.type !== 'group' || !details) return;

    updateGroupNode(
      updateNodeData,
      selectedNode.id,
      patch.title ?? details.data.title,
      patch.blocks ?? details.blocks,
      patch.activeBlockId ?? details.activeBlockId
    );
  };

  const patchBlock = (blockId: string, partial: Partial<Block>) => {
    if (!details) return;

    patchGroup({
      blocks: details.blocks.map((block) =>
        block.id === blockId ? ({ ...block, ...partial } as Block) : block
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    if (!details) return;
    const nextBlocks = details.blocks.filter((block) => block.id !== blockId);
    patchGroup({
      blocks: nextBlocks,
      activeBlockId: nextBlocks[0]?.id || null,
    });
  };

  if (!selectedNode) {
    return (
      <aside className="w-[340px] border-l border-slate-200 bg-slate-50/60 p-6 flex flex-col justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <Settings2 size={26} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Editor panel</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Select a group on the canvas to edit its title, block sequence, and validation rules.
          </p>
        </div>
      </aside>
    );
  }

  if (selectedNode.id === 'start') {
    return (
      <aside className="w-[340px] border-l border-slate-200 bg-slate-50/60 p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Layers3 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Start node</h3>
              <p className="text-xs text-slate-500">This is the flow entry point.</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Connect the start node to the first group. The preview engine begins from that first outgoing edge.
          </p>
        </div>
      </aside>
    );
  }

  if (!details) return null;

  return (
    <aside className="w-[340px] border-l border-slate-200 bg-slate-50/60 p-6 overflow-y-auto">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Layers3 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Group settings</h3>
                <p className="text-xs text-slate-500">Edit the selected node and its active block.</p>
              </div>
            </div>
            <button
              onClick={deleteNode}
              className="rounded-xl border border-transparent p-2 text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Group title
          </label>
          <input
            value={details.data.title}
            onChange={(event) => patchGroup({ title: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-orange-300"
            placeholder="Untitled group"
          />

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MetricCard label="Blocks" value={String(details.blocks.length)} />
            <MetricCard
              label="Bubbles"
              value={String(details.blocks.filter((block) => block.kind === 'bubble').length)}
            />
            <MetricCard
              label="Inputs"
              value={String(details.blocks.filter((block) => block.kind === 'input').length)}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Block order
          </label>
          <div className="space-y-2">
            {details.blocks.map((block, index) => (
              <button
                key={block.id}
                onClick={() => patchGroup({ activeBlockId: block.id })}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                  details.activeBlockId === block.id
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      {index + 1}. {getBlockLabel(block)}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {block.kind === 'bubble'
                        ? (block as BubbleBlock).content || 'Empty content'
                        : (block as InputBlock).prompt || 'Empty prompt'}
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {block.kind}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {details.activeBlock && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  {details.activeBlock.kind === 'bubble' ? (
                    <MessageSquare size={18} />
                  ) : (
                    <Keyboard size={18} />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{getBlockLabel(details.activeBlock)}</h4>
                  <p className="text-xs text-slate-500">
                    {details.activeBlock.kind === 'bubble' ? 'Message block' : 'Collect user input'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteBlock(details.activeBlock!.id)}
                className="rounded-xl border border-transparent p-2 text-slate-400 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {details.activeBlock.kind === 'bubble' ? (
              <BubbleSettings
                block={details.activeBlock as BubbleBlock}
                onChange={(partial) => patchBlock(details.activeBlock!.id, partial)}
              />
            ) : (
              <InputSettings
                block={details.activeBlock as InputBlock}
                onChange={(partial) => patchBlock(details.activeBlock!.id, partial)}
              />
            )}
          </section>
        )}
      </div>
    </aside>
  );
}

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
    <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
  </div>
);

const BubbleSettings = ({
  block,
  onChange,
}: {
  block: BubbleBlock;
  onChange: (partial: Partial<BubbleBlock>) => void;
}) => (
  <div className="space-y-4">
    <Field label="Content">
      {block.type === 'text' ? (
        <textarea
          value={block.content}
          onChange={(event) => onChange({ content: event.target.value })}
          rows={5}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          placeholder="Write the message your bot should send..."
        />
      ) : (
        <input
          value={block.content}
          onChange={(event) => onChange({ content: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          placeholder="Paste the URL that should be shown in preview"
        />
      )}
    </Field>
  </div>
);

const InputSettings = ({
  block,
  onChange,
}: {
  block: InputBlock;
  onChange: (partial: Partial<InputBlock>) => void;
}) => (
  <div className="space-y-4">
    <Field label="Prompt">
      <textarea
        value={block.prompt}
        onChange={(event) => onChange({ prompt: event.target.value })}
        rows={3}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
        placeholder="Ask the user for the information you need"
      />
    </Field>

    <Field label="Variable name">
      <input
        value={block.variable}
        onChange={(event) => onChange({ variable: formatVariableName(event.target.value) })}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
        placeholder="customer_email"
      />
    </Field>

    <Field label="Placeholder">
      <input
        value={block.placeholder}
        onChange={(event) => onChange({ placeholder: event.target.value })}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
        placeholder="Enter your answer"
      />
    </Field>

    <Field label="Button label">
      <input
        value={block.buttonLabel}
        onChange={(event) => onChange({ buttonLabel: event.target.value })}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
        placeholder="Continue"
      />
    </Field>

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Validation</div>
          <div className="text-xs text-slate-500">Typebot-style defaults with editable rules.</div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={block.validation.required}
            onChange={(event) =>
              onChange({
                validation: {
                  ...block.validation,
                  required: event.target.checked,
                },
              })
            }
          />
          Required
        </label>
      </div>

      {block.type === 'text' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min length">
            <input
              type="number"
              value={block.validation.minLength ?? ''}
              onChange={(event) =>
                onChange({
                  validation: {
                    ...block.validation,
                    minLength: event.target.value ? Number(event.target.value) : undefined,
                  },
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
          <Field label="Max length">
            <input
              type="number"
              value={block.validation.maxLength ?? ''}
              onChange={(event) =>
                onChange({
                  validation: {
                    ...block.validation,
                    maxLength: event.target.value ? Number(event.target.value) : undefined,
                  },
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
        </div>
      )}

      {block.type === 'number' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min">
            <input
              type="number"
              value={block.validation.min ?? ''}
              onChange={(event) =>
                onChange({
                  validation: {
                    ...block.validation,
                    min: event.target.value ? Number(event.target.value) : undefined,
                  },
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
          <Field label="Max">
            <input
              type="number"
              value={block.validation.max ?? ''}
              onChange={(event) =>
                onChange({
                  validation: {
                    ...block.validation,
                    max: event.target.value ? Number(event.target.value) : undefined,
                  },
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
        </div>
      )}

      <Field label="Custom error message">
        <input
          value={block.validation.customError ?? ''}
          onChange={(event) =>
            onChange({
              validation: {
                ...block.validation,
                customError: event.target.value || undefined,
              },
            })
          }
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          placeholder="Optional custom validation message"
        />
      </Field>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </span>
    {children}
  </label>
);
