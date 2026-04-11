import type { Block, InputBlock } from '@/lib/blocks';
import type { VariableStore } from '@/lib/flowRuntime/variableStore';

export interface RuntimeFlowNode {
  id: string;
  type?: string;
  data?: unknown;
}

export interface RuntimeFlowEdge {
  id?: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface RuntimeFlow {
  id?: string;
  name?: string;
  nodes: RuntimeFlowNode[];
  edges: RuntimeFlowEdge[];
}

export type RuntimeMessageType = 'bot' | 'user' | 'system' | 'integration';
export type RuntimeContentType = 'text' | 'image' | 'video' | 'audio' | 'embed';

export interface RuntimeMessage {
  id: string;
  type: RuntimeMessageType;
  contentType: RuntimeContentType;
  content: string;
  blockId?: string;
  nodeId?: string;
  meta?: Record<string, unknown>;
}

export type FlowSessionStatus = 'running' | 'waiting' | 'completed' | 'error';

export interface PendingInput {
  nodeId: string;
  blockIndex: number;
  block: InputBlock;
}

export interface FlowSessionState {
  id: string;
  flowId?: string;
  flow: RuntimeFlow;
  status: FlowSessionStatus;
  variables: Record<string, string>;
  currentNodeId: string | null;
  currentBlockIndex: number;
  pendingInput?: PendingInput;
  messages: RuntimeMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface EngineResult {
  sessionId: string;
  status: FlowSessionStatus;
  messages: RuntimeMessage[];
  variables: Record<string, string>;
  pendingInput?: PublicPendingInput;
  currentNodeId: string | null;
  currentBlockIndex: number;
}

export interface PublicPendingInput {
  id: string;
  type: InputBlock['type'];
  prompt: string;
  variable: string;
  placeholder: string;
  buttonLabel: string;
  options?: InputBlock['options'];
  ratingScale?: number;
  acceptedFileTypes?: string;
  maxFileSizeMb?: number;
  currency?: string;
  amount?: number;
  paymentMethods?: InputBlock['paymentMethods'];
  phoneCountryCode?: string;
  fileSources?: InputBlock['fileSources'];
  allowMultipleFiles?: boolean;
}

export interface BlockHandlerContext {
  flow: RuntimeFlow;
  session: FlowSessionState;
  nodeId: string;
  blockIndex: number;
  variables: VariableStore;
  messages: RuntimeMessage[];
}

export type BlockHandlerResult =
  | { action: 'continue' }
  | { action: 'pause'; input: InputBlock }
  | { action: 'branch'; branch: string }
  | { action: 'complete' };

export interface IntegrationContext {
  flow: RuntimeFlow;
  session: FlowSessionState;
  variables: VariableStore;
}

export interface IntegrationResult {
  ok: boolean;
  message?: string;
  variable?: string;
  value?: unknown;
  data?: unknown;
}

export type IntegrationHandler = (block: Block, context: IntegrationContext) => Promise<IntegrationResult>;
