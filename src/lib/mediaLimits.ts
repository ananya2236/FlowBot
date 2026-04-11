export const MEDIA_UPLOAD_LIMIT_MB = 10;
export const MEDIA_BLOCK_LIMIT_PER_TYPE = 10;
export type MediaLimitedType = 'image' | 'video' | 'audio';
type BubbleBlockType = 'text' | 'image' | 'video' | 'audio' | 'embed';
type GroupNodeDataLike = {
  blocks?: Array<{ kind?: string; type?: string }>;
  bubbles?: Array<{ type?: string }>;
};

export const LIMITED_MEDIA_TYPES: MediaLimitedType[] = ['image', 'video', 'audio'];

export function getDefaultMediaLimit(type: BubbleBlockType) {
  if (!isLimitedMediaType(type)) return undefined;
  return {
    maxFileSizeMb: MEDIA_UPLOAD_LIMIT_MB,
    maxQuantity: MEDIA_BLOCK_LIMIT_PER_TYPE,
  };
}

export function getMediaFileLimitError(file: File, type: BubbleBlockType) {
  if (!isLimitedMediaType(type)) return null;
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MEDIA_UPLOAD_LIMIT_MB) {
    return `${capitalize(type)} files must be ${MEDIA_UPLOAD_LIMIT_MB}MB or smaller.`;
  }
  return null;
}

export function countMediaBlocksInNodes(nodes: Array<{ data?: unknown }>, type: BubbleBlockType) {
  return nodes.reduce((count, node) => count + countMediaBlocksInGroup((node.data || {}) as Partial<GroupNodeDataLike>, type), 0);
}

export function canAddMediaBlock(nodes: Array<{ data?: unknown }>, type: BubbleBlockType) {
  return countMediaBlocksInNodes(nodes, type) < MEDIA_BLOCK_LIMIT_PER_TYPE;
}

function countMediaBlocksInGroup(data: Partial<GroupNodeDataLike>, type: BubbleBlockType) {
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  const bubbles = Array.isArray(data.bubbles) ? data.bubbles : [];
  const blockCount = blocks.filter((block) => block.kind === 'bubble' && block.type === type).length;
  const legacyCount = bubbles.filter((bubble) => bubble.type === type).length;
  return blockCount + legacyCount;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isLimitedMediaType(type: BubbleBlockType): type is MediaLimitedType {
  return LIMITED_MEDIA_TYPES.includes(type as MediaLimitedType);
}
