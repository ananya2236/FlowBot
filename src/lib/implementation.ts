import type { Edge, Node } from 'reactflow';
import type { Bot } from '@/lib/store';
import { migrateToBlocks, sanitizeFlowEdges, type GroupNodeData } from '@/lib/blocks';

export interface PublishScriptConfig {
  scriptEndpoint: string;
  workspaceLink?: string;
}

export interface ImplementationPayload {
  schemaVersion: '1.0.0';
  generatedAt: string;
  bot: {
    id: string;
    name: string;
    status: Bot['status'];
    updatedAt: string;
  };
  script: PublishScriptConfig;
  theme: Bot['theme'];
  flow: {
    nodeCount: number;
    edgeCount: number;
    nodes: Array<{
      id: string;
      type: string;
      position: Node['position'];
      data: unknown;
    }>;
    edges: Array<{
      id?: string;
      source: string;
      sourceHandle?: string | null;
      target: string;
      targetHandle?: string | null;
    }>;
  };
}

function serializeNodeData(node: Node) {
  if (node.type !== 'group') return node.data;
  const groupData = node.data as GroupNodeData;
  return {
    title: groupData.title,
    activeBlockId: groupData.activeBlockId || null,
    blocks: migrateToBlocks(groupData),
  };
}

export function buildImplementationPayload(bot: Bot, config: PublishScriptConfig): ImplementationPayload {
  const safeEdges = sanitizeFlowEdges(bot.edges as Edge[], bot.nodes as Node[]);

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    bot: {
      id: bot.id,
      name: bot.name,
      status: bot.status,
      updatedAt: new Date(bot.updatedAt).toISOString(),
    },
    script: {
      scriptEndpoint: config.scriptEndpoint,
      workspaceLink: config.workspaceLink || undefined,
    },
    theme: bot.theme,
    flow: {
      nodeCount: bot.nodes.length,
      edgeCount: safeEdges.length,
      nodes: bot.nodes.map((node) => ({
        id: node.id,
        type: node.type || 'group',
        position: node.position,
        data: serializeNodeData(node),
      })),
      edges: safeEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
      })),
    },
  };
}
