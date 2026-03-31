"use client";
import React, { useMemo } from 'react';
import {
  Trash2,
  Settings2,
  Layers3,
  MessageSquare,
  Keyboard,
  GitBranch,
  ArrowRight,
  Code2,
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
  updateNodeData(nodeId, {
    title: groupTitle,
    blocks,
    activeBlockId,
  });
}

function getBlockIcon(block: Block) {
  if (block.kind === 'bubble') return <MessageSquare size={18} />;
  if (block.kind === 'input') return <Keyboard size={18} />;
  if (block.type === 'condition') return <GitBranch size={18} />;
  if (block.type === 'redirect') return <ArrowRight size={18} />;
  return <Code2 size={18} />;
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
            Select a group on the canvas to edit its title, block sequence, logic, and validation rules.
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
            Connect the start node to the first group. The preview engine starts from that first edge.
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

          <Field label="Group title">
            <input
              value={details.data.title}
              onChange={(event) => patchGroup({ title: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-orange-300"
              placeholder="Untitled group"
            />
          </Field>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MetricCard label="Blocks" value={String(details.blocks.length)} />
            <MetricCard
              label="Inputs"
              value={String(details.blocks.filter((block) => block.kind === 'input').length)}
            />
            <MetricCard
              label="Logic"
              value={String(details.blocks.filter((block) => block.kind === 'logic').length)}
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
                    <div className="mt-1 text-xs text-slate-500">{getBlockSummary(block)}</div>
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
                  {getBlockIcon(details.activeBlock)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{getBlockLabel(details.activeBlock)}</h4>
                  <p className="text-xs text-slate-500">
                    {details.activeBlock.kind === 'bubble'
                      ? 'Message block'
                      : details.activeBlock.kind === 'input'
                        ? 'Collect user input'
                        : 'Execute preview logic'}
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
            ) : details.activeBlock.kind === 'input' ? (
              <InputSettings
                block={details.activeBlock as InputBlock}
                onChange={(partial) => patchBlock(details.activeBlock!.id, partial)}
              />
            ) : (
              <LogicSettings
                block={details.activeBlock as LogicBlock}
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

    {(block.type === 'buttons' || block.type === 'pic_choice' || block.type === 'cards') && (
      <Field label="Options">
        <OptionEditor
          options={block.options || []}
          onChange={(options) => onChange({ options })}
        />
      </Field>
    )}

    {block.type === 'rating' && (
      <Field label="Rating scale">
        <input
          type="number"
          min={2}
          max={10}
          value={block.ratingScale ?? 5}
          onChange={(event) =>
            onChange({
              ratingScale: event.target.value ? Number(event.target.value) : 5,
            })
          }
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
        />
      </Field>
    )}

    {block.type === 'payment' && (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Currency">
            <input
              value={block.currency ?? 'USD'}
              onChange={(event) => onChange({ currency: event.target.value.toUpperCase() })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
              placeholder="USD"
            />
          </Field>
          <Field label="Amount">
            <input
              type="number"
              value={block.amount ?? 99}
              onChange={(event) =>
                onChange({
                  amount: event.target.value ? Number(event.target.value) : 0,
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
        </div>
        <Field label="Payment methods">
          <OptionEditor
            options={block.paymentMethods || []}
            onChange={(paymentMethods) => onChange({ paymentMethods })}
          />
        </Field>
      </div>
    )}

    {block.type === 'file' && (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="File types">
            <input
              value={block.acceptedFileTypes ?? '.pdf,.doc,.jpg,.png'}
              onChange={(event) => onChange({ acceptedFileTypes: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
              placeholder=".pdf,.doc,.png"
            />
          </Field>
          <Field label="Max size (MB)">
            <input
              type="number"
              value={block.maxFileSizeMb ?? 10}
              onChange={(event) =>
                onChange({
                  maxFileSizeMb: event.target.value ? Number(event.target.value) : 10,
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            File sources
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(block.fileSources || []).includes('device')}
                onChange={(event) => {
                  const next = new Set(block.fileSources || []);
                  if (event.target.checked) next.add('device');
                  else next.delete('device');
                  onChange({ fileSources: Array.from(next) as FileSource[] });
                }}
              />
              Device upload
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(block.fileSources || []).includes('cloud_link')}
                onChange={(event) => {
                  const next = new Set(block.fileSources || []);
                  if (event.target.checked) next.add('cloud_link');
                  else next.delete('cloud_link');
                  onChange({ fileSources: Array.from(next) as FileSource[] });
                }}
              />
              Cloud/Drive link
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!block.allowMultipleFiles}
                onChange={(event) => onChange({ allowMultipleFiles: event.target.checked })}
              />
              Allow multiple files
            </label>
          </div>
        </div>
      </div>
    )}

    {block.type === 'phone' && (
      <div className="grid grid-cols-3 gap-3">
        <Field label="Country code">
          <input
            value={block.phoneCountryCode ?? '+91'}
            onChange={(event) => onChange({ phoneCountryCode: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          />
        </Field>
        <Field label="Min digits">
          <input
            type="number"
            value={block.phoneMinDigits ?? 10}
            onChange={(event) =>
              onChange({
                phoneMinDigits: event.target.value ? Number(event.target.value) : 7,
              })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          />
        </Field>
        <Field label="Max digits">
          <input
            type="number"
            value={block.phoneMaxDigits ?? 10}
            onChange={(event) =>
              onChange({
                phoneMaxDigits: event.target.value ? Number(event.target.value) : 15,
              })
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          />
        </Field>
      </div>
    )}

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
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

      {block.type === 'rating' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min rating">
            <input
              type="number"
              value={block.validation.min ?? 1}
              onChange={(event) =>
                onChange({
                  validation: {
                    ...block.validation,
                    min: event.target.value ? Number(event.target.value) : 1,
                  },
                })
              }
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
          <Field label="Max rating">
            <input
              type="number"
              value={block.validation.max ?? block.ratingScale ?? 5}
              onChange={(event) =>
                onChange({
                  validation: {
                    ...block.validation,
                    max: event.target.value ? Number(event.target.value) : block.ratingScale ?? 5,
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

const OptionEditor = ({
  options,
  onChange,
}: {
  options: InputChoice[];
  onChange: (options: InputChoice[]) => void;
}) => {
  const updateOption = (id: string, label: string) => {
    onChange(
      options.map((option) =>
        option.id === id
          ? {
              ...option,
              label,
              value: formatVariableName(label),
            }
          : option
      )
    );
  };

  const addOption = () => {
    const next = [...options, { id: `opt_${Date.now()}`, label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` }];
    onChange(next);
  };

  const removeOption = (id: string) => {
    onChange(options.filter((option) => option.id !== id));
  };

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <input
            value={option.label}
            onChange={(event) => updateOption(option.id, event.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            placeholder="Option label"
          />
          <button
            type="button"
            onClick={() => removeOption(option.id)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:border-orange-300 hover:text-orange-600"
      >
        Add option
      </button>
    </div>
  );
};

const LogicSettings = ({
  block,
  onChange,
}: {
  block: LogicBlock;
  onChange: (partial: Partial<LogicBlock>) => void;
}) => {
  if (block.type === 'set_variable') {
    const setVariable = block as SetVariableBlock;
    return (
      <div className="space-y-4">
        <Field label="Variable name">
          <input
            value={setVariable.variable}
            onChange={(event) => onChange({ variable: formatVariableName(event.target.value) })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            placeholder="status"
          />
        </Field>
        <Field label="Value">
          <input
            value={setVariable.value}
            onChange={(event) => onChange({ value: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            placeholder="qualified"
          />
        </Field>
        <Hint>
          This block stores a value in preview runtime. You can reference variables later with syntax like
          <span className="font-mono text-slate-700"> {'{{status}}'}</span>.
        </Hint>
      </div>
    );
  }

  if (block.type === 'condition') {
    const condition = block as ConditionBlock;
    const isUnary = condition.operator === 'is_empty' || condition.operator === 'not_empty';

    return (
      <div className="space-y-4">
        <Field label="Variable name">
          <input
            value={condition.variable}
            onChange={(event) => onChange({ variable: formatVariableName(event.target.value) })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            placeholder="status"
          />
        </Field>

        <Field label="Operator">
          <select
            value={condition.operator}
            onChange={(event) => onChange({ operator: event.target.value as ConditionOperator })}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          >
            {CONDITION_OPERATORS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        {!isUnary && (
          <Field label="Compare with">
            <input
              value={condition.value}
              onChange={(event) => onChange({ value: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
              placeholder="qualified"
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="True branch label">
            <input
              value={condition.trueLabel}
              onChange={(event) => onChange({ trueLabel: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
          <Field label="False branch label">
            <input
              value={condition.falseLabel}
              onChange={(event) => onChange({ falseLabel: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
            />
          </Field>
        </div>

        <Hint>Connect the two condition handles on the canvas to different groups to branch preview flow.</Hint>
      </div>
    );
  }

  const redirect = block as RedirectBlock;
  return (
    <div className="space-y-4">
      <Field label="Preview label">
        <input
          value={redirect.label}
          onChange={(event) => onChange({ label: event.target.value })}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-300"
          placeholder="Redirect to another group"
        />
      </Field>
      <Hint>Connect this block to another group. Preview will immediately jump through that edge.</Hint>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {label}
    </span>
    {children}
  </label>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
    {children}
  </div>
);
