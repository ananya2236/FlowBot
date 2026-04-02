export type BubbleBlockType = 'text' | 'image' | 'video' | 'audio' | 'embed';
export type InputBlockType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'website'
  | 'time'
  | 'buttons'
  | 'pic_choice'
  | 'payment'
  | 'rating'
  | 'file'
  | 'cards';
export type LogicBlockType = 'set_variable' | 'condition' | 'redirect';
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'not_empty';

export type SupportedSidebarType =
  | 'bubble'
  | BubbleBlockType
  | `input_${InputBlockType}`
  | `logic_${LogicBlockType}`;

export interface BaseBlock {
  id: string;
  kind: 'bubble' | 'input' | 'logic';
  type: string;
}

export interface BubbleBlock extends BaseBlock {
  kind: 'bubble';
  type: BubbleBlockType;
  content: string;
  attachmentSource?: BubbleAttachmentSource;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  driveLink?: string;
}

export interface InputValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customError?: string;
}

export interface InputChoice {
  id: string;
  label: string;
  value: string;
}

export type FileSource = 'device' | 'cloudLink';
export type BubbleAttachmentSource = 'device' | 'drive' | 'link';

export interface InputBlock extends BaseBlock {
  kind: 'input';
  type: InputBlockType;
  prompt: string;
  variable: string;
  placeholder: string;
  buttonLabel: string;
  validation: InputValidation;
  options?: InputChoice[];
  ratingScale?: number;
  acceptedFileTypes?: string;
  maxFileSizeMb?: number;
  currency?: string;
  amount?: number;
  paymentMethods?: InputChoice[];
  phoneCountryCode?: string;
  phoneMinDigits?: number;
  phoneMaxDigits?: number;
  fileSources?: FileSource[];
  allowMultipleFiles?: boolean;
}

export interface SetVariableBlock extends BaseBlock {
  kind: 'logic';
  type: 'set_variable';
  variable: string;
  value: string;
}

export interface ConditionBlock extends BaseBlock {
  kind: 'logic';
  type: 'condition';
  variable: string;
  operator: ConditionOperator;
  value: string;
  trueLabel: string;
  falseLabel: string;
}

export interface RedirectBlock extends BaseBlock {
  kind: 'logic';
  type: 'redirect';
  label: string;
}

export type LogicBlock = SetVariableBlock | ConditionBlock | RedirectBlock;
export type Block = BubbleBlock | InputBlock | LogicBlock;

export interface GroupNodeData {
  title: string;
  blocks: Block[];
  activeBlockId?: string | null;
}

interface LegacyBubble {
  id?: string;
  type?: string;
  content?: string;
  attachmentSource?: BubbleAttachmentSource;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  driveLink?: string;
}

interface LegacyInput {
  id?: string;
  type?: string;
  prompt?: string;
  variable?: string;
  placeholder?: string;
  buttonLabel?: string;
  validation?: Partial<InputValidation>;
  options?: InputChoice[];
  ratingScale?: number;
  acceptedFileTypes?: string;
  maxFileSizeMb?: number;
  currency?: string;
  amount?: number;
  paymentMethods?: InputChoice[];
  phoneCountryCode?: string;
  phoneMinDigits?: number;
  phoneMaxDigits?: number;
  fileSources?: FileSource[];
  file_sources?: ('device' | 'cloud_link')[];
  allowMultipleFiles?: boolean;
}

interface LegacyBlock {
  id?: string;
  kind?: 'bubble' | 'input' | 'logic';
  type?: string;
  content?: string;
  prompt?: string;
  variable?: string;
  placeholder?: string;
  buttonLabel?: string;
  validation?: Partial<InputValidation>;
  options?: InputChoice[];
  ratingScale?: number;
  acceptedFileTypes?: string;
  maxFileSizeMb?: number;
  currency?: string;
  amount?: number;
  paymentMethods?: InputChoice[];
  phoneCountryCode?: string;
  phoneMinDigits?: number;
  phoneMaxDigits?: number;
  fileSources?: FileSource[];
  file_sources?: ('device' | 'cloud_link')[];
  allowMultipleFiles?: boolean;
  attachmentSource?: BubbleAttachmentSource;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  driveLink?: string;
  value?: string;
  operator?: ConditionOperator;
  trueLabel?: string;
  falseLabel?: string;
  label?: string;
}

interface FlowEdgeLike {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

interface FlowNodeLike {
  id: string;
  type?: string;
  data?: unknown;
}

const SUPPORTED_TYPES: SupportedSidebarType[] = [
  'bubble',
  'text',
  'image',
  'video',
  'audio',
  'embed',
  'input_text',
  'input_number',
  'input_email',
  'input_phone',
  'input_date',
  'input_website',
  'input_time',
  'input_buttons',
  'input_pic_choice',
  'input_payment',
  'input_rating',
  'input_file',
  'input_cards',
  'logic_set_variable',
  'logic_condition',
  'logic_redirect',
];

const BLOCK_LABELS: Record<string, string> = {
  text: 'Text',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  embed: 'Embed',
  input_text: 'Text input',
  input_number: 'Number input',
  input_email: 'Email input',
  input_phone: 'Phone input',
  input_date: 'Date input',
  input_website: 'Website input',
  input_time: 'Time input',
  input_buttons: 'Buttons input',
  input_pic_choice: 'Picture choice input',
  input_payment: 'Payment input',
  input_rating: 'Rating input',
  input_file: 'File input',
  input_cards: 'Cards input',
  logic_set_variable: 'Set variable',
  logic_condition: 'Condition',
  logic_redirect: 'Redirect',
};

const BUBBLE_TYPES: BubbleBlockType[] = ['text', 'image', 'video', 'audio', 'embed'];
const INPUT_TYPES: InputBlockType[] = [
  'text',
  'number',
  'email',
  'phone',
  'date',
  'website',
  'time',
  'buttons',
  'pic_choice',
  'payment',
  'rating',
  'file',
  'cards',
];
const LOGIC_TYPES: LogicBlockType[] = ['set_variable', 'condition', 'redirect'];

function createId() {
  return Math.random().toString(36).slice(2, 11);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'path';
}

function slugifyVariable(value: string) {
  return toSlug(value) || 'response';
}

export function isSupportedSidebarType(value: string): value is SupportedSidebarType {
  return SUPPORTED_TYPES.includes(value as SupportedSidebarType);
}

export function getBlockLabel(block: Block) {
  if (block.kind === 'bubble') return BLOCK_LABELS[block.type];
  if (block.kind === 'input') return BLOCK_LABELS[`input_${block.type}`];
  return BLOCK_LABELS[`logic_${block.type}`];
}

function isBubbleType(value?: string): value is BubbleBlockType {
  return typeof value === 'string' && BUBBLE_TYPES.includes(value as BubbleBlockType);
}

function isInputType(value?: string): value is InputBlockType {
  return typeof value === 'string' && INPUT_TYPES.includes(value as InputBlockType);
}

function isLogicType(value?: string): value is LogicBlockType {
  return typeof value === 'string' && LOGIC_TYPES.includes(value as LogicBlockType);
}

export function getDefaultValidation(type: InputBlockType): InputValidation {
  switch (type) {
    case 'text':
      return { required: true, minLength: 1, maxLength: 160 };
    case 'number':
      return { required: true };
    case 'email':
      return {
        required: true,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        customError: 'Please enter a valid email address.',
      };
    case 'phone':
      return {
        required: true,
        pattern: '^\\+?[0-9 ()-]{7,20}$',
        customError: 'Please enter a valid phone number.',
      };
    case 'date':
      return { required: true };
    case 'website':
      return {
        required: true,
        pattern: '^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]{2,}(\\/.*)?$',
        customError: 'Please enter a valid website URL.',
      };
    case 'time':
      return {
        required: true,
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
        customError: 'Please enter a valid time in HH:MM format.',
      };
    case 'buttons':
    case 'pic_choice':
    case 'cards':
      return { required: true };
    case 'payment':
      return { required: true };
    case 'rating':
      return { required: true, min: 1, max: 5 };
    case 'file':
      return { required: true };
    default:
      return { required: true };
  }
}

function createDefaultOptions(type: InputBlockType): InputChoice[] | undefined {
  if (type === 'buttons') {
    return [
      { id: createId(), label: '', value: '' },
    ];
  }
  if (type === 'pic_choice') {
    return [
      { id: createId(), label: '', value: '' },
    ];
  }
  if (type === 'cards') {
    return [
      { id: createId(), label: '', value: '' },
    ];
  }
  return undefined;
}

function createDefaultPaymentMethods(): InputChoice[] {
  return [
    { id: createId(), label: '', value: '' },
  ];
}

function normalizeFileSources(fileSources?: FileSource[], legacyFileSources?: ('device' | 'cloud_link')[]) {
  if (fileSources?.length) return fileSources;
  if (!legacyFileSources?.length) return undefined;
  return legacyFileSources.map((source) => (source === 'cloud_link' ? 'cloudLink' : source));
}

export function getBubbleAttachmentUrl(block: BubbleBlock) {
  if (block.type === 'text') return block.content;
  return block.attachmentUrl || block.content || '';
}

export function createDefaultBlock(sidebarType: string): Block | null {
  if (!isSupportedSidebarType(sidebarType)) return null;

  const id = createId();

  if (sidebarType.startsWith('input_')) {
    const type = sidebarType.replace('input_', '') as InputBlockType;
    const options = createDefaultOptions(type);

    return {
      id,
      kind: 'input',
      type,
      prompt: `What is your ${type}?`,
      variable: slugifyVariable(type),
      placeholder: `Enter your ${type}`,
      buttonLabel: 'Continue',
      validation: getDefaultValidation(type),
      options,
      ratingScale: type === 'rating' ? 5 : undefined,
      acceptedFileTypes: type === 'file' ? '.pdf,.doc,.jpg,.png' : undefined,
      maxFileSizeMb: type === 'file' ? 10 : undefined,
      currency: type === 'payment' ? 'USD' : undefined,
      amount: type === 'payment' ? 99 : undefined,
      paymentMethods: type === 'payment' ? createDefaultPaymentMethods() : undefined,
      phoneCountryCode: type === 'phone' ? '+91' : undefined,
      phoneMinDigits: type === 'phone' ? 10 : undefined,
      phoneMaxDigits: type === 'phone' ? 10 : undefined,
      fileSources: type === 'file' ? ['device', 'cloudLink'] : undefined,
      allowMultipleFiles: type === 'file' ? false : undefined,
    };
  }

  if (sidebarType.startsWith('logic_')) {
    const type = sidebarType.replace('logic_', '') as LogicBlockType;

    if (type === 'set_variable') {
      return {
        id,
        kind: 'logic',
        type,
        variable: 'status',
        value: 'qualified',
      };
    }

    if (type === 'condition') {
      return {
        id,
        kind: 'logic',
        type,
        variable: 'status',
        operator: 'equals',
        value: 'qualified',
        trueLabel: 'True',
        falseLabel: 'False',
      };
    }

    return {
      id,
      kind: 'logic',
      type,
      label: 'Redirect to another group',
    };
  }

  const bubbleType = sidebarType === 'bubble' ? 'text' : sidebarType;
  const defaults: Record<BubbleBlockType, string> = {
    text: 'Hello! Ask me anything.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    embed: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  };

  return {
    id,
    kind: 'bubble',
    type: bubbleType as BubbleBlockType,
    content: defaults[bubbleType as BubbleBlockType],
    attachmentSource: bubbleType === 'text' ? undefined : 'link',
    attachmentUrl: bubbleType === 'text' ? undefined : defaults[bubbleType as BubbleBlockType],
  };
}

export function createGroupData(title: string, block: Block): GroupNodeData {
  return {
    title,
    blocks: [block],
    activeBlockId: block.id,
  };
}

export function getBlockHandleId(blockId: string, branch?: string) {
  return branch ? `handle-${blockId}-${branch}` : `handle-${blockId}`;
}

export function getBlockSummary(block: Block, variables?: Record<string, string>) {
  if (block.kind === 'bubble') {
    const bubble = block as BubbleBlock;
    return resolveTemplate(getBubbleAttachmentUrl(bubble), variables);
  }

  if (block.kind === 'input') {
    return resolveTemplate(block.prompt, variables);
  }

  if (block.type === 'set_variable') {
    return `${block.variable} = ${resolveTemplate(block.value, variables)}`;
  }

  if (block.type === 'condition') {
    const rightValue = block.operator === 'is_empty' || block.operator === 'not_empty' ? '' : ` ${block.value}`;
    return `${block.variable} ${block.operator}${rightValue}`;
  }

  return block.label;
}

function normalizeBlock(block: LegacyBlock): Block | null {
  if (block.kind === 'bubble' && isBubbleType(block.type)) {
    const attachmentUrl = block.attachmentUrl || block.content || '';
    return {
      id: block.id || createId(),
      kind: 'bubble',
      type: block.type,
      content: block.content || '',
      attachmentSource: block.type === 'text' ? undefined : block.attachmentSource || 'link',
      attachmentUrl: block.type === 'text' ? undefined : attachmentUrl,
      attachmentName: block.attachmentName,
      attachmentMimeType: block.attachmentMimeType,
      driveLink: block.driveLink,
    };
  }

  if (block.kind === 'input' && isInputType(block.type)) {
    return {
      id: block.id || createId(),
      kind: 'input',
      type: block.type,
      prompt: block.prompt || `What is your ${block.type}?`,
      variable: block.variable || slugifyVariable(block.type),
      placeholder: block.placeholder || `Enter your ${block.type}`,
      buttonLabel: block.buttonLabel || 'Continue',
      validation: {
        ...getDefaultValidation(block.type),
        ...(block.validation || {}),
      },
      options: block.options,
      ratingScale: block.ratingScale || (block.type === 'rating' ? 5 : undefined),
      acceptedFileTypes: block.acceptedFileTypes || (block.type === 'file' ? '.pdf,.doc,.jpg,.png' : undefined),
      maxFileSizeMb: block.maxFileSizeMb || (block.type === 'file' ? 10 : undefined),
      currency: block.currency || (block.type === 'payment' ? 'USD' : undefined),
      amount: typeof block.amount === 'number' ? block.amount : block.type === 'payment' ? 99 : undefined,
      paymentMethods: block.paymentMethods || (block.type === 'payment' ? createDefaultPaymentMethods() : undefined),
      phoneCountryCode: block.phoneCountryCode || (block.type === 'phone' ? '+91' : undefined),
      phoneMinDigits: block.phoneMinDigits || (block.type === 'phone' ? 10 : undefined),
      phoneMaxDigits: block.phoneMaxDigits || (block.type === 'phone' ? 10 : undefined),
      fileSources: normalizeFileSources(block.fileSources, block.file_sources) || (block.type === 'file' ? ['device', 'cloudLink'] : undefined),
      allowMultipleFiles: typeof block.allowMultipleFiles === 'boolean' ? block.allowMultipleFiles : block.type === 'file' ? false : undefined,
    };
  }

  if (block.kind === 'logic' && isLogicType(block.type)) {
    if (block.type === 'set_variable') {
      return {
        id: block.id || createId(),
        kind: 'logic',
        type: 'set_variable',
        variable: block.variable || 'status',
        value: block.value || 'qualified',
      };
    }

    if (block.type === 'condition') {
      return {
        id: block.id || createId(),
        kind: 'logic',
        type: 'condition',
        variable: block.variable || 'status',
        operator: block.operator || 'equals',
        value: block.value || 'qualified',
        trueLabel: block.trueLabel || 'True',
        falseLabel: block.falseLabel || 'False',
      };
    }

    return {
      id: block.id || createId(),
      kind: 'logic',
      type: 'redirect',
      label: block.label || 'Redirect to another group',
    };
  }

  return null;
}

export function migrateToBlocks(
  data: Partial<GroupNodeData> & { bubbles?: LegacyBubble[]; inputs?: LegacyInput[] }
) {
  if (data.blocks?.length) {
    return data.blocks
      .map((block) => normalizeBlock(block as LegacyBlock))
      .filter((block): block is Block => block !== null);
  }

  const blocks: Block[] = [];

  for (const bubble of data.bubbles || []) {
    const normalized = normalizeBlock({
      id: bubble.id,
      kind: 'bubble',
      type: bubble.type,
      content: bubble.content,
    });

    if (normalized) blocks.push(normalized);
  }

  for (const input of data.inputs || []) {
    const normalized = normalizeBlock({
      id: input.id,
      kind: 'input',
      type: input.type,
      prompt: input.prompt,
      variable: input.variable,
      placeholder: input.placeholder,
      buttonLabel: input.buttonLabel,
      validation: input.validation,
      options: input.options,
      ratingScale: input.ratingScale,
      acceptedFileTypes: input.acceptedFileTypes,
      maxFileSizeMb: input.maxFileSizeMb,
      currency: input.currency,
      amount: input.amount,
      paymentMethods: input.paymentMethods,
      phoneCountryCode: input.phoneCountryCode,
      phoneMinDigits: input.phoneMinDigits,
      phoneMaxDigits: input.phoneMaxDigits,
      fileSources: input.fileSources,
      allowMultipleFiles: input.allowMultipleFiles,
    });

    if (normalized) blocks.push(normalized);
  }

  return blocks;
}

export function validateInputBlock(block: InputBlock, rawValue: string) {
  const value = rawValue.trim();
  const { validation } = block;

  if (!value && validation.required) {
    return validation.customError || 'This field is required.';
  }

  if (!value) return null;

  if (block.type === 'text') {
    if (validation.minLength && value.length < validation.minLength) {
      return validation.customError || `Please enter at least ${validation.minLength} characters.`;
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      return validation.customError || `Please enter no more than ${validation.maxLength} characters.`;
    }
  }

  if (block.type === 'number') {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return validation.customError || 'Please enter a valid number.';
    }
    if (typeof validation.min === 'number' && numberValue < validation.min) {
      return validation.customError || `Please enter a number greater than or equal to ${validation.min}.`;
    }
    if (typeof validation.max === 'number' && numberValue > validation.max) {
      return validation.customError || `Please enter a number less than or equal to ${validation.max}.`;
    }
  }

  if (block.type === 'date' && Number.isNaN(Date.parse(value))) {
    return validation.customError || 'Please enter a valid date.';
  }

  if (block.type === 'phone') {
    const digits = value.replace(/\D/g, '');
    const minDigits = block.phoneMinDigits || 7;
    const maxDigits = block.phoneMaxDigits || 15;
    if (digits.length < minDigits || digits.length > maxDigits) {
      return validation.customError || `Phone number must contain ${minDigits}-${maxDigits} digits.`;
    }
  }

  if (block.type === 'buttons' || block.type === 'pic_choice' || block.type === 'cards') {
    if (block.options?.length) {
      const allowedValues = block.options.map((option) => option.value);
      if (!allowedValues.includes(value)) {
        return validation.customError || 'Please select one of the available options.';
      }
    }
  }

  if (block.type === 'rating') {
    const rating = Number(value);
    const maxRating = block.ratingScale || 5;
    if (Number.isNaN(rating) || rating < 1 || rating > maxRating) {
      return validation.customError || `Please select a rating from 1 to ${maxRating}.`;
    }
  }

  if (block.type === 'payment') {
    const normalized = value.toLowerCase();
    if (!['paid', 'success', 'completed', 'done'].includes(normalized)) {
      return validation.customError || 'Type "paid" after completing payment.';
    }
  }

  if (validation.pattern) {
    const pattern = new RegExp(validation.pattern);
    if (!pattern.test(value)) {
      return validation.customError || 'Please enter a valid value.';
    }
  }

  return null;
}

export function resolveTemplate(value: string, variables: Record<string, string> = {}) {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, variableName: string) => {
    return variables[variableName] ?? '';
  });
}

export function evaluateCondition(block: ConditionBlock, variables: Record<string, string>) {
  const leftValue = variables[block.variable] ?? '';
  const rightValue = resolveTemplate(block.value, variables);

  switch (block.operator) {
    case 'equals':
      return leftValue === rightValue;
    case 'not_equals':
      return leftValue !== rightValue;
    case 'contains':
      return leftValue.includes(rightValue);
    case 'greater_than':
      return Number(leftValue) > Number(rightValue);
    case 'less_than':
      return Number(leftValue) < Number(rightValue);
    case 'is_empty':
      return leftValue.trim() === '';
    case 'not_empty':
      return leftValue.trim() !== '';
    default:
      return false;
  }
}

export function findBlockEdge(
  edges: FlowEdgeLike[],
  nodeId: string,
  blockId?: string | null,
  branch?: string
) {
  if (!blockId) {
    return edges.find((edge) => edge.source === nodeId && edge.sourceHandle === 'main-source') || null;
  }

  const sourceHandle = getBlockHandleId(blockId, branch);
  return edges.find((edge) => edge.source === nodeId && edge.sourceHandle === sourceHandle) || null;
}

function getGroupSourceHandles(data: unknown) {
  const blocks = migrateToBlocks((data || {}) as Partial<GroupNodeData>);

  if (blocks.length === 0) {
    return new Set(['main-source']);
  }

  const handles = new Set<string>();

  blocks.forEach((block) => {
    if (block.kind === 'logic' && block.type === 'condition') {
      handles.add(getBlockHandleId(block.id, 'true'));
      handles.add(getBlockHandleId(block.id, 'false'));
      return;
    }

    if (block.kind === 'input') {
      const branches = getInputBranches(block);
      if (branches.length) {
        branches.forEach((branch) => {
          handles.add(getBlockHandleId(block.id, getInputBranchKey(branch.value)));
        });
        return;
      }
    }

    handles.add(getBlockHandleId(block.id));
  });

  return handles;
}

export function sanitizeFlowEdges<T extends FlowEdgeLike>(edges: T[], nodes: FlowNodeLike[]) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return edges.filter((edge) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    if (!sourceNode || !targetNode) return false;

    if (sourceNode.type === 'start') {
      if (edge.sourceHandle && edge.sourceHandle !== '') return false;
    } else if (sourceNode.type === 'group') {
      if (!edge.sourceHandle) return false;
      const validHandles = getGroupSourceHandles(sourceNode.data);
      if (!validHandles.has(edge.sourceHandle)) return false;
    }

    if (targetNode.type === 'group') {
      if (edge.targetHandle && edge.targetHandle !== 'main-target') return false;
    } else if (targetNode.type === 'start') {
      return false;
    }

    return true;
  });
}

export function getInputBranches(block: InputBlock) {
  if (block.type === 'buttons' || block.type === 'pic_choice' || block.type === 'cards') {
    return (block.options || []).map((option) => ({
      value: option.value,
      label: option.label,
    }));
  }

  if (block.type === 'payment') {
    return (block.paymentMethods || []).map((method) => ({
      value: method.value,
      label: method.label,
    }));
  }

  if (block.type === 'rating') {
    const scale = block.ratingScale || 5;
    return Array.from({ length: scale }, (_, index) => ({
      value: String(index + 1),
      label: `${index + 1} star`,
    }));
  }

  return [];
}

export function getInputBranchKey(value: string) {
  return `branch_${toSlug(value)}`;
}

export function formatVariableName(value: string) {
  return slugifyVariable(value);
}
