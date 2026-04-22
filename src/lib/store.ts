import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from 'reactflow';
import { sanitizeFlowEdges, type GroupNodeData } from '@/lib/blocks';
import { createDefaultBotSettings, normalizeBotSettings, type BotSettings } from '@/lib/botSettings';
import { createDefaultThemeSettings, normalizeThemeSettings, type BotThemeSettings } from '@/lib/theme';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface Bot {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  theme: BotThemeSettings;
  settings: BotSettings;
  status: 'Draft' | 'Live';
  updatedAt: number;
  createdAt?: number;
}

interface BotSnapshot {
  name: string;
  nodes: Node[];
  edges: Edge[];
  theme: BotThemeSettings;
  settings: BotSettings;
  status: Bot['status'];
  createdAt?: number;
}

interface RemotePersistenceHandlers {
  saveBot: (bot: Bot) => Promise<void>;
  deleteBot: (botId: string) => Promise<void>;
}

interface BotStore {
  bots: Bot[];
  activeBotId: string | null;
  editorNodeId: string | null;
  previewNodeId: string | null;
  historyPast: Record<string, BotSnapshot[]>;
  historyFuture: Record<string, BotSnapshot[]>;
  remoteEnabled: boolean;
  botsLoaded: boolean;
  pendingSyncBotIds: string[];

  configureRemotePersistence: (config: {
    enabled: boolean;
    handlers: RemotePersistenceHandlers | null;
  }) => void;
  setBotsLoaded: (loaded: boolean) => void;
  mergeRemoteBots: (bots: Bot[]) => void;

  createBot: (name?: string) => string;
  deleteBot: (id: string) => void;
  renameBot: (id: string, name: string) => void;
  setBotStatus: (id: string, status: Bot['status']) => void;
  updateBotTheme: (id: string, theme: Partial<BotThemeSettings>) => void;
  updateBotSettings: (id: string, settings: DeepPartial<BotSettings>) => void;
  setActiveBot: (id: string | null) => void;
  setPreviewNodeId: (id: string | null) => void;
  setEditorNodeId: (id: string | null) => void;
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

const remoteSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const remoteSyncQueues = new Map<string, Promise<void>>();
let remoteHandlers: RemotePersistenceHandlers | null = null;

function enqueueRemoteSync(botId: string, operation: () => Promise<void>) {
  const queuedOperation = (remoteSyncQueues.get(botId) ?? Promise.resolve())
    .catch(() => {
      // Keep the queue alive even if a prior operation failed.
    })
    .then(operation);

  remoteSyncQueues.set(botId, queuedOperation);

  void queuedOperation.finally(() => {
    if (remoteSyncQueues.get(botId) === queuedOperation) {
      remoteSyncQueues.delete(botId);
    }
  });

  return queuedOperation;
}

const createInitialNodes = (): Node[] =>
  initialNodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  }));

function cloneBotSnapshot(bot: Bot): BotSnapshot {
  return {
    name: bot.name,
    theme: JSON.parse(JSON.stringify(bot.theme)),
    settings: JSON.parse(JSON.stringify(bot.settings)),
    status: bot.status,
    createdAt: bot.createdAt,
    nodes: bot.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: node.data ? JSON.parse(JSON.stringify(node.data)) : node.data,
    })),
    edges: bot.edges.map((edge) => ({ ...edge })),
  };
}

function cloneBot(bot: Bot): Bot {
  return {
    ...bot,
    settings: JSON.parse(JSON.stringify(bot.settings)),
    theme: JSON.parse(JSON.stringify(bot.theme)),
    nodes: bot.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: node.data ? JSON.parse(JSON.stringify(node.data)) : node.data,
    })),
    edges: bot.edges.map((edge) => ({ ...edge })),
  };
}

function normalizeBot(bot: Partial<Bot> & Pick<Bot, 'id' | 'name' | 'nodes' | 'edges' | 'status' | 'updatedAt'>): Bot {
  return {
    ...bot,
    settings: normalizeBotSettings(bot.settings),
    theme: normalizeThemeSettings(bot.theme),
    createdAt: bot.createdAt ?? bot.updatedAt,
  };
}

function clearPendingRemoteSave(botId: string) {
  const timer = remoteSaveTimers.get(botId);
  if (timer) {
    clearTimeout(timer);
    remoteSaveTimers.delete(botId);
  }
}

function setPendingSync(botId: string, pending: boolean) {
  useStore.setState((state) => {
    const pendingIds = new Set(state.pendingSyncBotIds);
    if (pending) {
      pendingIds.add(botId);
    } else {
      pendingIds.delete(botId);
    }
    return { pendingSyncBotIds: Array.from(pendingIds) };
  });
}

async function saveBotNow(bot: Bot) {
  if (!remoteHandlers) return;
  setPendingSync(bot.id, true);
  void enqueueRemoteSync(bot.id, async () => {
    try {
      await remoteHandlers?.saveBot(cloneBot(bot));
    } catch (error) {
      console.error(`Failed to sync bot ${bot.id} to Convex.`, error);
    } finally {
      setPendingSync(bot.id, false);
    }
  });
}

function scheduleRemoteSave(bot: Bot, delayMs = 450) {
  if (!remoteHandlers) return;
  clearPendingRemoteSave(bot.id);
  setPendingSync(bot.id, true);
  remoteSaveTimers.set(
    bot.id,
    setTimeout(() => {
      remoteSaveTimers.delete(bot.id);
      void saveBotNow(bot);
    }, delayMs)
  );
}

function deleteBotRemotely(botId: string) {
  clearPendingRemoteSave(botId);
  if (!remoteHandlers) return;
  setPendingSync(botId, true);
  void enqueueRemoteSync(botId, async () => {
    try {
      await remoteHandlers?.deleteBot(botId);
    } catch (error) {
      console.error(`Failed to delete bot ${botId} in Convex.`, error);
    } finally {
      setPendingSync(botId, false);
    }
  });
}

function withTrackedBotUpdate(
  state: BotStore,
  botId: string,
  updater: (bot: Bot) => Bot
): Pick<BotStore, 'bots' | 'historyPast' | 'historyFuture'> | BotStore {
  const targetBot = state.bots.find((bot) => bot.id === botId);
  if (!targetBot) return state;

  const nextBot = updater(targetBot);
  scheduleRemoteSave(nextBot);

  return {
    bots: state.bots.map((bot) => (bot.id === botId ? nextBot : bot)),
    historyPast: {
      ...state.historyPast,
      [botId]: [...(state.historyPast[botId] || []), cloneBotSnapshot(targetBot)].slice(-100),
    },
    historyFuture: { ...state.historyFuture, [botId]: [] },
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
      remoteEnabled: false,
      botsLoaded: false,
      pendingSyncBotIds: [],

      configureRemotePersistence: ({ enabled, handlers }) => {
        remoteHandlers = handlers;
        if (!enabled) {
          remoteSaveTimers.forEach((timer) => clearTimeout(timer));
          remoteSaveTimers.clear();
          set({ remoteEnabled: false, botsLoaded: true, pendingSyncBotIds: [] });
          return;
        }

        set({ remoteEnabled: true });
      },

      setBotsLoaded: (loaded) => {
        set({ botsLoaded: loaded });
      },

      mergeRemoteBots: (incomingBots) => {
        set((state) => {
          const pendingIds = new Set(state.pendingSyncBotIds);
          const localBots = new Map(state.bots.map((bot) => [bot.id, bot]));
          const mergedBots = incomingBots.map((remoteBot) => {
            const normalizedRemoteBot = normalizeBot(remoteBot);
            const localBot = localBots.get(remoteBot.id);
            if (
              localBot &&
              pendingIds.has(remoteBot.id) &&
              localBot.updatedAt >= remoteBot.updatedAt
            ) {
              return localBot;
            }
            return normalizedRemoteBot;
          });

          return {
            bots: mergedBots,
            botsLoaded: true,
            activeBotId:
              state.activeBotId && mergedBots.some((bot) => bot.id === state.activeBotId)
                ? state.activeBotId
                : null,
          };
        });
      },

      createBot: (name = 'My Spinabot') => {
        const timestamp = Date.now();
        const id = nanoid();
        const newBot: Bot = {
          id,
          name,
          nodes: createInitialNodes(),
          edges: [],
          theme: createDefaultThemeSettings(),
          settings: createDefaultBotSettings(),
          status: 'Draft',
          updatedAt: timestamp,
          createdAt: timestamp,
        };

        set((state) => ({
          bots: [...state.bots, newBot],
          activeBotId: id,
          botsLoaded: true,
        }));

        if (remoteHandlers) {
          void saveBotNow(newBot);
        }

        return id;
      },

      deleteBot: (id) => {
        set((state) => ({
          bots: state.bots.filter((bot) => bot.id !== id),
          activeBotId: state.activeBotId === id ? null : state.activeBotId,
        }));
        deleteBotRemotely(id);
      },

      renameBot: (id, name) => {
        set((state) =>
          withTrackedBotUpdate(state, id, (bot) => ({
            ...bot,
            name,
            updatedAt: Date.now(),
          }))
        );
      },

      setBotStatus: (id, status) => {
        set((state) =>
          withTrackedBotUpdate(state, id, (bot) => ({
            ...bot,
            status,
            updatedAt: Date.now(),
          }))
        );
      },

      updateBotTheme: (id, theme) => {
        set((state) =>
          withTrackedBotUpdate(state, id, (bot) => ({
            ...bot,
            theme: normalizeThemeSettings({ ...bot.theme, ...theme }),
            updatedAt: Date.now(),
          }))
        );
      },

      updateBotSettings: (id, settings) => {
        set((state) =>
          withTrackedBotUpdate(state, id, (bot) => ({
            ...bot,
            settings: normalizeBotSettings({
              ...bot.settings,
              ...settings,
              general: { ...bot.settings.general, ...(settings.general ?? {}) },
              typing: { ...bot.settings.typing, ...(settings.typing ?? {}) },
              security: { ...bot.settings.security, ...(settings.security ?? {}) },
              metadata: { ...bot.settings.metadata, ...(settings.metadata ?? {}) },
            }),
            updatedAt: Date.now(),
          }))
        );
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
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;
        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            nodes: applyNodeChanges(changes, activeBot.nodes),
            updatedAt: Date.now(),
          }))
        );
      },

      onEdgesChange: (changes) => {
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;
        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            edges: applyEdgeChanges(changes, activeBot.edges),
            updatedAt: Date.now(),
          }))
        );
      },

      onConnect: (connection) => {
        if (connection.sourceHandle === 'main-target') return;
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;

        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            edges: sanitizeFlowEdges(addEdge(connection, activeBot.edges), activeBot.nodes),
            updatedAt: Date.now(),
          }))
        );
      },

      addNode: (type, position, data = {}) => {
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;
        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            nodes: [
              ...activeBot.nodes,
              {
                id: nanoid(),
                type,
                position,
                data: { ...data },
              },
            ],
            updatedAt: Date.now(),
          }))
        );
      },

      updateNodeData: (nodeId, data) => {
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;
        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            nodes: activeBot.nodes.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: { ...node.data, ...data },
                  }
                : node
            ),
            updatedAt: Date.now(),
          }))
        );
      },

      setNodes: (nodes) => {
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;
        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            nodes,
            updatedAt: Date.now(),
          }))
        );
      },

      setEdges: (edges) => {
        const activeBotId = get().activeBotId;
        if (!activeBotId) return;
        set((state) =>
          withTrackedBotUpdate(state, activeBotId, (activeBot) => ({
            ...activeBot,
            edges,
            updatedAt: Date.now(),
          }))
        );
      },

      undo: () => {
        const { activeBotId } = get();
        if (!activeBotId) return;

        set((state) => {
          const activeBot = state.bots.find((bot) => bot.id === activeBotId);
          const past = state.historyPast[activeBotId] || [];
          if (!activeBot || past.length === 0) return state;

          const previous = past[past.length - 1];
          const updatedBot = {
            ...activeBot,
            name: previous.name,
            nodes: previous.nodes,
            edges: previous.edges,
            theme: previous.theme,
            settings: previous.settings,
            status: previous.status,
            createdAt: previous.createdAt,
            updatedAt: Date.now(),
          };
          scheduleRemoteSave(updatedBot);

          return {
            ...state,
            historyPast: { ...state.historyPast, [activeBotId]: past.slice(0, -1) },
            historyFuture: {
              ...state.historyFuture,
              [activeBotId]: [cloneBotSnapshot(activeBot), ...(state.historyFuture[activeBotId] || [])].slice(0, 100),
            },
            bots: state.bots.map((bot) => (bot.id === activeBotId ? updatedBot : bot)),
          };
        });
      },

      redo: () => {
        const { activeBotId } = get();
        if (!activeBotId) return;

        set((state) => {
          const activeBot = state.bots.find((bot) => bot.id === activeBotId);
          const future = state.historyFuture[activeBotId] || [];
          if (!activeBot || future.length === 0) return state;

          const nextSnapshot = future[0];
          const updatedBot = {
            ...activeBot,
            name: nextSnapshot.name,
            nodes: nextSnapshot.nodes,
            edges: nextSnapshot.edges,
            theme: nextSnapshot.theme,
            settings: nextSnapshot.settings,
            status: nextSnapshot.status,
            createdAt: nextSnapshot.createdAt,
            updatedAt: Date.now(),
          };
          scheduleRemoteSave(updatedBot);

          return {
            ...state,
            historyPast: {
              ...state.historyPast,
              [activeBotId]: [...(state.historyPast[activeBotId] || []), cloneBotSnapshot(activeBot)].slice(-100),
            },
            historyFuture: { ...state.historyFuture, [activeBotId]: future.slice(1) },
            bots: state.bots.map((bot) => (bot.id === activeBotId ? updatedBot : bot)),
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
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<BotStore> | undefined;
        const persistedBots = typedState?.bots ?? [];
        return {
          ...currentState,
          ...typedState,
          bots: persistedBots.map((bot) => normalizeBot(bot)),
        };
      },
      partialize: (state) => ({
        bots: state.bots,
        activeBotId: state.activeBotId,
        remoteEnabled: state.remoteEnabled,
      }),
    }
  )
);

export default useStore;
