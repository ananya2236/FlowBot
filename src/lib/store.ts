import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import { sanitizeFlowEdges, type GroupNodeData } from '@/lib/blocks';

export interface Bot {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  status: 'Draft' | 'Live';
  updatedAt: number;
}

interface FlowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

interface BotStore {
  bots: Bot[];
  activeBotId: string | null;
  editorNodeId: string | null;
  previewNodeId: string | null;
  historyPast: Record<string, FlowSnapshot[]>;
  historyFuture: Record<string, FlowSnapshot[]>;
  
  // Bot management
  createBot: (name?: string) => string;
  deleteBot: (id: string) => void;
  renameBot: (id: string, name: string) => void;
  setBotStatus: (id: string, status: Bot['status']) => void;
  setActiveBot: (id: string | null) => void;
  setPreviewNodeId: (id: string | null) => void;
  
  // Editor panel
  setEditorNodeId: (id: string | null) => void;
  
  // Flow management for active bot
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position: { x: number; y: number }, data?: Partial<GroupNodeData>) => void;
  updateNodeData: (nodeId: string, data: Partial<GroupNodeData>) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: (botId?: string) => boolean;
  canRedo: (botId?: string) => boolean;
}

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 100, y: 100 },
    data: {},
  },
];

const createInitialNodes = (): Node[] =>
  initialNodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  }));

function cloneFlowSnapshot(bot: Bot): FlowSnapshot {
  return {
    nodes: bot.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: node.data ? JSON.parse(JSON.stringify(node.data)) : node.data,
    })),
    edges: bot.edges.map((edge) => ({ ...edge })),
  };
}

const useStore = create<BotStore>()(
  persist(
    (set, get) => ({
      bots: [],
      activeBotId: null,
      editorNodeId: null,
      previewNodeId: null,
      historyPast: {},
      historyFuture: {},

      createBot: (name = 'My Spinabot') => {
        const id = nanoid();
        const newBot: Bot = {
          id,
          name,
          nodes: createInitialNodes(),
          edges: [],
          status: 'Draft',
          updatedAt: Date.now(),
        };
        set((state) => ({
          bots: [...state.bots, newBot],
          activeBotId: id,
        }));
        return id;
      },

      deleteBot: (id) => {
        set((state) => ({
          bots: state.bots.filter((b) => b.id !== id),
          activeBotId: state.activeBotId === id ? null : state.activeBotId,
        }));
      },

      renameBot: (id, name) => {
        set((state) => ({
          bots: state.bots.map((b) => (b.id === id ? { ...b, name, updatedAt: Date.now() } : b)),
        }));
      },

      setBotStatus: (id, status) => {
        set((state) => ({
          bots: state.bots.map((b) => (b.id === id ? { ...b, status, updatedAt: Date.now() } : b)),
        }));
      },

      setActiveBot: (id) => {
        set({ activeBotId: id, editorNodeId: null, previewNodeId: null });
      },

      setPreviewNodeId: (id) => {
        set({ previewNodeId: id });
      },

      setEditorNodeId: (id) => {
        set({ editorNodeId: id });
      },

      onNodesChange: (changes) => {
        const { activeBotId, bots } = get();
        if (!activeBotId) return;
        const activeBot = bots.find((b) => b.id === activeBotId);
        if (!activeBot) return;

        const updatedNodes = applyNodeChanges(changes, activeBot.nodes);
        set((state) => ({
          historyPast: {
            ...state.historyPast,
            [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
          },
          historyFuture: { ...state.historyFuture, [activeBotId]: [] },
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, nodes: updatedNodes, updatedAt: Date.now() } : b
          ),
        }));
      },

      onEdgesChange: (changes) => {
        const { activeBotId, bots } = get();
        if (!activeBotId) return;
        const activeBot = bots.find((b) => b.id === activeBotId);
        if (!activeBot) return;

        const updatedEdges = applyEdgeChanges(changes, activeBot.edges);
        set((state) => ({
          historyPast: {
            ...state.historyPast,
            [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
          },
          historyFuture: { ...state.historyFuture, [activeBotId]: [] },
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, edges: updatedEdges, updatedAt: Date.now() } : b
          ),
        }));
      },

      onConnect: (connection) => {
        const { activeBotId, bots } = get();
        if (!activeBotId) return;
        const activeBot = bots.find((b) => b.id === activeBotId);
        if (!activeBot) return;
        if (connection.sourceHandle === 'main-target') return;

        const updatedEdges = sanitizeFlowEdges(addEdge(connection, activeBot.edges), activeBot.nodes);
        set((state) => ({
          historyPast: {
            ...state.historyPast,
            [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
          },
          historyFuture: { ...state.historyFuture, [activeBotId]: [] },
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, edges: updatedEdges, updatedAt: Date.now() } : b
          ),
        }));
      },

      addNode: (type, position, data: Partial<GroupNodeData> = {}) => {
        const { activeBotId, bots } = get();
        if (!activeBotId) return;
        const activeBot = bots.find((b) => b.id === activeBotId);
        if (!activeBot) return;

        const newNode: Node = {
          id: nanoid(),
          type,
          position,
          data: { ...data },
        };
        set((state) => ({
          historyPast: {
            ...state.historyPast,
            [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
          },
          historyFuture: { ...state.historyFuture, [activeBotId]: [] },
          bots: state.bots.map((b) =>
            b.id === activeBotId
              ? { ...b, nodes: [...b.nodes, newNode], updatedAt: Date.now() }
              : b
          ),
        }));
      },

      updateNodeData: (nodeId, data) => {
        const { activeBotId, bots } = get();
        if (!activeBotId) return;
        const activeBot = bots.find((b) => b.id === activeBotId);
        if (!activeBot) return;

        const updatedNodes = activeBot.nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...data },
            };
          }
          return node;
        });

        set((state) => ({
          historyPast: {
            ...state.historyPast,
            [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
          },
          historyFuture: { ...state.historyFuture, [activeBotId]: [] },
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, nodes: updatedNodes, updatedAt: Date.now() } : b
          ),
        }));
      },

      setNodes: (nodes) => {
        const { activeBotId } = get();
        if (!activeBotId) return;
        set((state) => {
          const activeBot = state.bots.find((b) => b.id === activeBotId);
          if (!activeBot) return state;
          return {
            ...state,
            historyPast: {
              ...state.historyPast,
              [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
            },
            historyFuture: { ...state.historyFuture, [activeBotId]: [] },
            bots: state.bots.map((b) =>
              b.id === activeBotId ? { ...b, nodes, updatedAt: Date.now() } : b
            ),
          };
        });
      },

      setEdges: (edges) => {
        const { activeBotId } = get();
        if (!activeBotId) return;
        set((state) => {
          const activeBot = state.bots.find((b) => b.id === activeBotId);
          if (!activeBot) return state;
          return {
            ...state,
            historyPast: {
              ...state.historyPast,
              [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100),
            },
            historyFuture: { ...state.historyFuture, [activeBotId]: [] },
            bots: state.bots.map((b) =>
              b.id === activeBotId ? { ...b, edges, updatedAt: Date.now() } : b
            ),
          };
        });
      },

      undo: () => {
        const { activeBotId } = get();
        if (!activeBotId) return;
        set((state) => {
          const activeBot = state.bots.find((b) => b.id === activeBotId);
          const past = state.historyPast[activeBotId] || [];
          if (!activeBot || past.length === 0) return state;

          const previous = past[past.length - 1];
          const nextPast = past.slice(0, -1);
          const nextFuture = [cloneFlowSnapshot(activeBot), ...(state.historyFuture[activeBotId] || [])].slice(0, 100);

          return {
            ...state,
            historyPast: { ...state.historyPast, [activeBotId]: nextPast },
            historyFuture: { ...state.historyFuture, [activeBotId]: nextFuture },
            bots: state.bots.map((b) =>
              b.id === activeBotId
                ? { ...b, nodes: previous.nodes, edges: previous.edges, updatedAt: Date.now() }
                : b
            ),
          };
        });
      },

      redo: () => {
        const { activeBotId } = get();
        if (!activeBotId) return;
        set((state) => {
          const activeBot = state.bots.find((b) => b.id === activeBotId);
          const future = state.historyFuture[activeBotId] || [];
          if (!activeBot || future.length === 0) return state;

          const next = future[0];
          const nextFuture = future.slice(1);
          const nextPast = [...(state.historyPast[activeBotId] || []), cloneFlowSnapshot(activeBot)].slice(-100);

          return {
            ...state,
            historyPast: { ...state.historyPast, [activeBotId]: nextPast },
            historyFuture: { ...state.historyFuture, [activeBotId]: nextFuture },
            bots: state.bots.map((b) =>
              b.id === activeBotId
                ? { ...b, nodes: next.nodes, edges: next.edges, updatedAt: Date.now() }
                : b
            ),
          };
        });
      },

      canUndo: (botId) => {
        const state = get();
        const currentBotId = botId || state.activeBotId;
        if (!currentBotId) return false;
        return (state.historyPast[currentBotId] || []).length > 0;
      },

      canRedo: (botId) => {
        const state = get();
        const currentBotId = botId || state.activeBotId;
        if (!currentBotId) return false;
        return (state.historyFuture[currentBotId] || []).length > 0;
      },
    }),
    {
      name: 'bot-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bots: state.bots, activeBotId: state.activeBotId }),
    }
  )
);

export default useStore;
