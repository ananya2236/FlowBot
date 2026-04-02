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

interface BotStore {
  bots: Bot[];
  activeBotId: string | null;
  editorNodeId: string | null;
  
  // Bot management
  createBot: (name?: string) => string;
  deleteBot: (id: string) => void;
  renameBot: (id: string, name: string) => void;
  setBotStatus: (id: string, status: Bot['status']) => void;
  setActiveBot: (id: string | null) => void;
  
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

const useStore = create<BotStore>()(
  persist(
    (set, get) => ({
      bots: [],
      activeBotId: null,
      editorNodeId: null,

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
        set({ activeBotId: id, editorNodeId: null });
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
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, nodes: updatedNodes, updatedAt: Date.now() } : b
          ),
        }));
      },

      setNodes: (nodes) => {
        const { activeBotId } = get();
        if (!activeBotId) return;
        set((state) => ({
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, nodes, updatedAt: Date.now() } : b
          ),
        }));
      },

      setEdges: (edges) => {
        const { activeBotId } = get();
        if (!activeBotId) return;
        set((state) => ({
          bots: state.bots.map((b) =>
            b.id === activeBotId ? { ...b, edges, updatedAt: Date.now() } : b
          ),
        }));
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
