import {
  evaluateCondition,
  getBubbleAttachmentUrl,
  type Block,
} from '@/lib/blocks';
import { integrationService } from '@/lib/flowRuntime/integrationService';
import type { BlockHandlerContext, BlockHandlerResult, RuntimeMessage } from '@/lib/flowRuntime/types';

export async function executeBlock(block: Block, context: BlockHandlerContext): Promise<BlockHandlerResult> {
  if (block.kind === 'bubble') {
    context.messages.push(createMessage({
      type: 'bot',
      contentType: block.type,
      content: context.variables.resolve(getBubbleAttachmentUrl(block)),
      blockId: block.id,
      nodeId: context.nodeId,
    }));
    return { action: 'continue' };
  }

  if (block.kind === 'input') {
    context.messages.push(createMessage({
      type: 'bot',
      contentType: 'text',
      content: context.variables.resolve(block.prompt),
      blockId: block.id,
      nodeId: context.nodeId,
      meta: { inputType: block.type },
    }));
    return { action: 'pause', input: block };
  }

  if (block.type === 'set_variable') {
    context.variables.set(block.variable, context.variables.resolve(block.value));
    return { action: 'continue' };
  }

  if (block.type === 'condition') {
    return { action: 'branch', branch: evaluateCondition(block, context.variables.all()) ? 'true' : 'false' };
  }

  const result = await integrationService.execute(block, {
    flow: context.flow,
    session: context.session,
    variables: context.variables,
  });

  if (result.variable) context.variables.set(result.variable, result.value ?? result.data ?? result.ok);
  if (result.message) {
    context.messages.push(createMessage({
      type: 'integration',
      contentType: 'text',
      content: result.message,
      blockId: block.id,
      nodeId: context.nodeId,
      meta: { integrationType: block.type, ok: result.ok },
    }));
  }

  return { action: 'continue' };
}

export function createMessage(message: Omit<RuntimeMessage, 'id'>): RuntimeMessage {
  return {
    id: crypto.randomUUID(),
    ...message,
  };
}
