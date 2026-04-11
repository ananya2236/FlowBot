import {
  findBlockEdge,
  getInputBranchKey,
  migrateToBlocks,
  sanitizeFlowEdges,
  validateInputBlock,
  type GroupNodeData,
} from '@/lib/blocks';
import { executeBlock, createMessage } from '@/lib/flowRuntime/nodeHandlers';
import { runtimeSessionStore } from '@/lib/flowRuntime/sessionStore';
import type {
  EngineResult,
  FlowSessionState,
  PublicPendingInput,
  RuntimeFlow,
  RuntimeFlowEdge,
  RuntimeFlowNode,
  RuntimeMessage,
} from '@/lib/flowRuntime/types';
import { VariableStore } from '@/lib/flowRuntime/variableStore';

const MAX_EXECUTION_STEPS = 250;

export const flowEngine = {
  async startFlow(input: { flow: RuntimeFlow; variables?: Record<string, unknown> }) {
    assertFlow(input.flow);

    const flow = normalizeFlow(input.flow);
    const firstGroupId = getFirstGroupId(flow);
    const now = Date.now();
    const session: FlowSessionState = {
      id: crypto.randomUUID(),
      flowId: flow.id,
      flow,
      status: 'running',
      variables: {},
      currentNodeId: firstGroupId,
      currentBlockIndex: 0,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    const variables = new VariableStore(input.variables || {});
    session.variables = variables.all();
    runtimeSessionStore.create(session);

    return executeUntilPause(session, variables, firstGroupId, 0);
  },

  async continueFlow(input: { sessionId: string; value: unknown }) {
    const session = runtimeSessionStore.get(input.sessionId);
    if (!session) throw new FlowEngineError('SESSION_NOT_FOUND', 'Flow session was not found.');
    if (!session.pendingInput) throw new FlowEngineError('NO_PENDING_INPUT', 'This flow is not waiting for input.');

    const pending = session.pendingInput;
    const value = normalizeInputValue(input.value);
    const validationError = validateInputBlock(pending.block, value);
    if (validationError) throw new FlowEngineError('VALIDATION_ERROR', validationError, 400);

    const variables = new VariableStore(session.variables);
    variables.set(pending.block.variable, value);

    const messages = [
      createMessage({
        type: 'user',
        contentType: 'text',
        content: value,
        blockId: pending.block.id,
        nodeId: pending.nodeId,
      }),
    ];
    session.messages.push(...messages);
    session.variables = variables.all();
    session.pendingInput = undefined;
    session.status = 'running';

    const branchEdge = findBlockEdge(
      session.flow.edges,
      pending.nodeId,
      pending.block.id,
      getInputBranchKey(value)
    );
    const blockEdge = branchEdge || findBlockEdge(session.flow.edges, pending.nodeId, pending.block.id);

    if (blockEdge) {
      return executeUntilPause(session, variables, blockEdge.target, 0, messages);
    }

    return executeUntilPause(session, variables, pending.nodeId, pending.blockIndex + 1, messages);
  },
};

async function executeUntilPause(
  session: FlowSessionState,
  variables: VariableStore,
  startNodeId: string | null,
  startBlockIndex: number,
  seedMessages: RuntimeMessage[] = []
): Promise<EngineResult> {
  const messages = [...seedMessages];
  let nodeId = startNodeId;
  let blockIndex = startBlockIndex;
  let steps = 0;

  while (nodeId) {
    if (steps++ > MAX_EXECUTION_STEPS) {
      session.status = 'error';
      session.currentNodeId = nodeId;
      session.currentBlockIndex = blockIndex;
      session.variables = variables.all();
      runtimeSessionStore.save(session);
      throw new FlowEngineError('MAX_STEPS_EXCEEDED', 'Flow execution exceeded the safety step limit.');
    }

    const node = getNode(session.flow.nodes, nodeId);
    if (!node || node.type !== 'group') {
      session.status = 'completed';
      session.currentNodeId = nodeId;
      session.currentBlockIndex = blockIndex;
      session.variables = variables.all();
      runtimeSessionStore.save(session);
      return toEngineResult(session, messages);
    }

    const blocks = migrateToBlocks((node.data || {}) as Partial<GroupNodeData>);
    const block = blocks[blockIndex];

    if (!block) {
      const groupEdge = findBlockEdge(session.flow.edges, nodeId, null);
      if (!groupEdge) {
        session.status = 'completed';
        session.currentNodeId = nodeId;
        session.currentBlockIndex = blockIndex;
        session.variables = variables.all();
        runtimeSessionStore.save(session);
        return toEngineResult(session, messages);
      }

      nodeId = groupEdge.target;
      blockIndex = 0;
      continue;
    }

    const result = await executeBlock(block, {
      flow: session.flow,
      session,
      nodeId,
      blockIndex,
      variables,
      messages,
    });

    session.currentNodeId = nodeId;
    session.currentBlockIndex = blockIndex;
    session.variables = variables.all();

    if (result.action === 'pause') {
      session.status = 'waiting';
      session.pendingInput = { nodeId, blockIndex, block: result.input };
      session.messages.push(...messages.filter((message) => !session.messages.some((saved) => saved.id === message.id)));
      runtimeSessionStore.save(session);
      return toEngineResult(session, messages);
    }

    if (result.action === 'complete') {
      session.status = 'completed';
      session.messages.push(...messages.filter((message) => !session.messages.some((saved) => saved.id === message.id)));
      runtimeSessionStore.save(session);
      return toEngineResult(session, messages);
    }

    const edge = result.action === 'branch'
      ? findBlockEdge(session.flow.edges, nodeId, block.id, result.branch)
      : findBlockEdge(session.flow.edges, nodeId, block.id);

    if (edge) {
      nodeId = edge.target;
      blockIndex = 0;
      continue;
    }

    blockIndex += 1;
  }

  session.status = 'completed';
  session.currentNodeId = nodeId;
  session.currentBlockIndex = blockIndex;
  session.variables = variables.all();
  runtimeSessionStore.save(session);
  return toEngineResult(session, messages);
}

function normalizeFlow(flow: RuntimeFlow): RuntimeFlow {
  return {
    ...flow,
    nodes: flow.nodes || [],
    edges: sanitizeFlowEdges((flow.edges || []) as RuntimeFlowEdge[], (flow.nodes || []) as RuntimeFlowNode[]),
  };
}

function getFirstGroupId(flow: RuntimeFlow) {
  const startNode = flow.nodes.find((node) => node.type === 'start');
  const startEdge = startNode
    ? flow.edges.find((edge) => edge.source === startNode.id)
    : null;

  return startEdge?.target || flow.nodes.find((node) => node.type === 'group')?.id || null;
}

function getNode(nodes: RuntimeFlowNode[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId) || null;
}

function toEngineResult(session: FlowSessionState, messages: RuntimeMessage[]): EngineResult {
  return {
    sessionId: session.id,
    status: session.status,
    messages,
    variables: session.variables,
    pendingInput: session.pendingInput ? toPublicPendingInput(session.pendingInput.block) : undefined,
    currentNodeId: session.currentNodeId,
    currentBlockIndex: session.currentBlockIndex,
  };
}

function toPublicPendingInput(block: NonNullable<FlowSessionState['pendingInput']>['block']): PublicPendingInput {
  return {
    id: block.id,
    type: block.type,
    prompt: block.prompt,
    variable: block.variable,
    placeholder: block.placeholder,
    buttonLabel: block.buttonLabel,
    options: block.options,
    ratingScale: block.ratingScale,
    acceptedFileTypes: block.acceptedFileTypes,
    maxFileSizeMb: block.maxFileSizeMb,
    currency: block.currency,
    amount: block.amount,
    paymentMethods: block.paymentMethods,
    phoneCountryCode: block.phoneCountryCode,
    fileSources: block.fileSources,
    allowMultipleFiles: block.allowMultipleFiles,
  };
}

function normalizeInputValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object' && 'value' in value) {
    return normalizeInputValue((value as { value: unknown }).value);
  }
  return '';
}

function assertFlow(flow: RuntimeFlow) {
  if (!flow || !Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) {
    throw new FlowEngineError('INVALID_FLOW', 'Expected a flow JSON object with nodes and edges.', 400);
  }
}

export class FlowEngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500
  ) {
    super(message);
  }
}
