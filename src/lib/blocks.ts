export type BubbleBlockType = 'text' | 'image' | 'video' | 'audio' | 'embed';
export type InputBlockType = 'text' | 'number' | 'email' | 'phone' | 'date';
export type SupportedSidebarType =
  | 'bubble'
  | BubbleBlockType
  | `input_${InputBlockType}`;

export interface BaseBlock {
  id: string;
  kind: 'bubble' | 'input';
  type: string;
}

export interface BubbleBlock extends BaseBlock {
  kind: 'bubble';
  type: BubbleBlockType;
  content: string;
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

export interface InputBlock extends BaseBlock {
  kind: 'input';
  type: InputBlockType;
  prompt: string;
  variable: string;
  placeholder: string;
  buttonLabel: string;
  validation: InputValidation;
}

export type Block = BubbleBlock | InputBlock;

export interface GroupNodeData {
  title: string;
  blocks: Block[];
  activeBlockId?: string | null;
}

interface LegacyBubble {
  id?: string;
  type?: string;
  content?: string;
}

interface LegacyInput {
  id?: string;
  type?: string;
  prompt?: string;
  variable?: string;
  placeholder?: string;
  buttonLabel?: string;
  validation?: Partial<InputValidation>;
}

interface LegacyBlock {
  id?: string;
  kind?: 'bubble' | 'input';
  type?: string;
  content?: string;
  prompt?: string;
  variable?: string;
  placeholder?: string;
  buttonLabel?: string;
  validation?: Partial<InputValidation>;
}

interface FlowEdgeLike {
  source: string;
  target: string;
  sourceHandle?: string | null;
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
};

const BUBBLE_TYPES: BubbleBlockType[] = ['text', 'image', 'video', 'audio', 'embed'];
const INPUT_TYPES: InputBlockType[] = ['text', 'number', 'email', 'phone', 'date'];

function createId() {
  return Math.random().toString(36).slice(2, 11);
}

function slugifyVariable(value: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return normalized || 'response';
}

export function isSupportedSidebarType(value: string): value is SupportedSidebarType {
  return SUPPORTED_TYPES.includes(value as SupportedSidebarType);
}

export function getBlockLabel(block: Block) {
  return block.kind === 'input'
    ? BLOCK_LABELS[`input_${block.type}`]
    : BLOCK_LABELS[block.type];
}

function isBubbleType(value?: string): value is BubbleBlockType {
  return typeof value === 'string' && BUBBLE_TYPES.includes(value as BubbleBlockType);
}

function isInputType(value?: string): value is InputBlockType {
  return typeof value === 'string' && INPUT_TYPES.includes(value as InputBlockType);
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
    default:
      return { required: true };
  }
}

export function createDefaultBlock(sidebarType: string): Block | null {
  if (!isSupportedSidebarType(sidebarType)) return null;

  const id = createId();

  if (sidebarType.startsWith('input_')) {
    const type = sidebarType.replace('input_', '') as InputBlockType;

    return {
      id,
      kind: 'input',
      type,
      prompt: `What is your ${type}?`,
      variable: slugifyVariable(type),
      placeholder: `Enter your ${type}`,
      buttonLabel: 'Continue',
      validation: getDefaultValidation(type),
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
  };
}

export function createGroupData(title: string, block: Block): GroupNodeData {
  return {
    title,
    blocks: [block],
    activeBlockId: block.id,
  };
}

function normalizeBlock(block: LegacyBlock): Block | null {
  if (block.kind === 'bubble' && isBubbleType(block.type)) {
    return {
      id: block.id || createId(),
      kind: 'bubble',
      type: block.type,
      content: block.content || '',
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
    };
  }

  return null;
}

export function migrateToBlocks(data: Partial<GroupNodeData> & { bubbles?: LegacyBubble[]; inputs?: LegacyInput[] }) {
  if (data.blocks?.length) {
    return data.blocks
      .map((block) => normalizeBlock(block as LegacyBlock))
      .filter((block): block is Block => block !== null);
  }

  const blocks: Block[] = [];

  for (const bubble of (data.bubbles || []) as LegacyBubble[]) {
    if (isBubbleType(bubble.type)) {
      blocks.push({
        id: bubble.id || createId(),
        kind: 'bubble',
        type: bubble.type,
        content: bubble.content || '',
      });
    }
  }

  for (const input of (data.inputs || []) as LegacyInput[]) {
    if (isInputType(input.type)) {
      blocks.push({
        id: input.id || createId(),
        kind: 'input',
        type: input.type,
        prompt: input.prompt || `What is your ${input.type}?`,
        variable: input.variable || slugifyVariable(input.type),
        placeholder: input.placeholder || `Enter your ${input.type}`,
        buttonLabel: input.buttonLabel || 'Continue',
        validation: {
          ...getDefaultValidation(input.type),
          ...(input.validation || {}),
        },
      });
    }
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

  if (block.type === 'date') {
    if (Number.isNaN(Date.parse(value))) {
      return validation.customError || 'Please enter a valid date.';
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

export function findBlockEdge(edges: FlowEdgeLike[], nodeId: string, blockId?: string | null) {
  if (!blockId) {
    return edges.find((edge) => edge.source === nodeId && edge.sourceHandle === 'main-source') || null;
  }

  return (
    edges.find(
      (edge) => edge.source === nodeId && edge.sourceHandle === `handle-${blockId}`
    ) || null
  );
}

export function formatVariableName(value: string) {
  return slugifyVariable(value);
}
