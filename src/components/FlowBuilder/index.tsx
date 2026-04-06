"use client";
import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  Position,
  useStoreApi as useReactFlowStoreApi,
  type Edge as FlowEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nanoid } from 'nanoid';
import GroupNode from './GroupNode';
import StartNode from './StartNode';
import CanvasToolbar from './CanvasToolbar';
import useStore from '@/lib/store';
import { createDefaultBlock, createGroupData, migrateToBlocks, sanitizeFlowEdges, type GroupNodeData } from '@/lib/blocks';

const nodeTypes = {
  group: GroupNode,
  start: StartNode,
};

const proOptions = { hideAttribution: true };
const emptyNodes: never[] = [];
const emptyEdges: never[] = [];

interface CopiedGroupTemplate {
  position: { x: number; y: number };
  data: GroupNodeData;
}

function cloneGroupDataWithFreshIds(sourceData: unknown): GroupNodeData {
  const raw = (sourceData || {}) as Partial<GroupNodeData>;
  const sourceBlocks = migrateToBlocks(raw);
  const idMap: Record<string, string> = {};
  const blocks = sourceBlocks.map((block) => {
    const nextId = nanoid();
    idMap[block.id] = nextId;
    return { ...block, id: nextId };
  });

  return {
    title: raw.title || 'Group',
    blocks,
    activeBlockId: raw.activeBlockId ? idMap[raw.activeBlockId] || blocks[0]?.id || null : blocks[0]?.id || null,
  };
}

const FlowBuilderInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowStoreApi = useReactFlowStoreApi();
  const copiedGroupsRef = useRef<CopiedGroupTemplate[]>([]);
  const pasteCountRef = useRef(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<FlowEdge | null>(null);
  const [edgeActionPos, setEdgeActionPos] = useState<{ x: number; y: number } | null>(null);
  
  const { 
    activeBotId, 
    bots, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,
    setEdges,
  } = useStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const block = createDefaultBlock(type);
      if (!block) return;

      const groupsCount = bots.find(b => b.id === activeBotId)?.nodes.filter(n => n.type === 'group').length || 0;

      addNode('group', position, createGroupData(`Group #${groupsCount + 1}`, block));
    },
    [screenToFlowPosition, addNode, bots, activeBotId]
  );

  const activeBot = bots.find(b => b.id === activeBotId);
  const selectedGroups = useMemo(
    () => (activeBot?.nodes || []).filter((node) => node.selected && node.type === 'group'),
    [activeBot]
  );
  const safeEdges = useMemo(() => {
    if (!activeBot) return [];
    return sanitizeFlowEdges(activeBot.edges, activeBot.nodes);
  }, [activeBot]);

  const renderedEdges = useMemo(() => {
    return safeEdges.map((edge) => ({
      ...edge,
      type: 'step',
      animated: false,
      style: { ...(edge.style || {}), stroke: '#ff6a00', strokeWidth: 1.9 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#ff6a00',
        width: 20,
        height: 20,
      },
    }));
  }, [safeEdges]);

  useEffect(() => {
    if (!activeBot) return;
    if (safeEdges.length === activeBot.edges.length) return;
    setEdges(safeEdges);
  }, [activeBot, safeEdges, setEdges]);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'step',
    animated: false,
    style: { stroke: '#ff6a00', strokeWidth: 1.9 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#ff6a00',
      width: 20,
      height: 20,
    },
  }), []);

  const snapGrid: [number, number] = useMemo(() => [12, 12], []);

  const cancelPendingConnection = useCallback(() => {
    reactFlowStoreApi.getState().cancelConnection();
    setIsConnecting(false);
  }, [reactFlowStoreApi]);

  const edgeMatches = useCallback((candidate: FlowEdge, target: FlowEdge) => {
    if (target.id) return candidate.id === target.id;
    return (
      candidate.source === target.source &&
      candidate.target === target.target &&
      (candidate.sourceHandle || '') === (target.sourceHandle || '') &&
      (candidate.targetHandle || '') === (target.targetHandle || '')
    );
  }, []);

  const removeSelectedEdge = useCallback(() => {
    if (!selectedEdge || !activeBot) return;
    const nextEdges = activeBot.edges.filter((edge) => !edgeMatches(edge, selectedEdge));
    setEdges(nextEdges);
    setSelectedEdge(null);
    setEdgeActionPos(null);
  }, [activeBot, edgeMatches, selectedEdge, setEdges]);

  const handleClickConnectStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent, params: { handleType: string | null }) => {
      if (params.handleType !== 'source') {
        cancelPendingConnection();
        return;
      }

      // Require double-tap / double-click for click-to-connect mode.
      if ('detail' in event && event.detail < 2) {
        cancelPendingConnection();
        return;
      }

      setIsConnecting(true);
    },
    [cancelPendingConnection]
  );

  const handleConnectStart = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, params: { handleType: string | null }) => {
      if (params.handleType !== 'source') {
        cancelPendingConnection();
        return;
      }
      // Keep drag-connect seamless.
      setIsConnecting(true);
    },
    [cancelPendingConnection]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isConnecting) {
        cancelPendingConnection();
        event.preventDefault();
        return;
      }

      const isCopy = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';
      const isPaste = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v';
      if (!isCopy && !isPaste) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        !!target &&
        (target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select');
      if (isTypingTarget) return;

      if (isCopy) {
        if (!selectedGroups.length) return;
        copiedGroupsRef.current = selectedGroups.map((node) => ({
          position: { x: node.position.x, y: node.position.y },
          data: cloneGroupDataWithFreshIds(node.data),
        }));
        pasteCountRef.current = 0;
        event.preventDefault();
        return;
      }

      if (!copiedGroupsRef.current.length) return;
      pasteCountRef.current += 1;
      const baseOffset = 56 * pasteCountRef.current;
      copiedGroupsRef.current.forEach((template, index) => {
        const perNodeOffset = index * 26;
        const data = cloneGroupDataWithFreshIds(template.data);
        addNode(
          'group',
          {
            x: template.position.x + baseOffset + perNodeOffset,
            y: template.position.y + baseOffset + perNodeOffset,
          },
          {
            ...data,
            title: `${data.title} Copy`,
          }
        );
      });
      event.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addNode, cancelPendingConnection, isConnecting, selectedGroups]);

  useEffect(() => {
    const onGlobalDoubleClick = () => {
      if (!isConnecting) return;
      cancelPendingConnection();
    };

    window.addEventListener('dblclick', onGlobalDoubleClick);
    return () => window.removeEventListener('dblclick', onGlobalDoubleClick);
  }, [cancelPendingConnection, isConnecting]);

  useEffect(() => {
    if (!selectedEdge) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedEdge(null);
        setEdgeActionPos(null);
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        removeSelectedEdge();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [removeSelectedEdge, selectedEdge]);

  return (
    <div className="w-full h-full min-h-0 relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={activeBot?.nodes || emptyNodes}
        edges={renderedEdges || emptyEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={() => setIsConnecting(false)}
        onClickConnectStart={handleClickConnectStart}
        onClickConnectEnd={() => setIsConnecting(false)}
        onEdgeClick={(event, edge) => {
          event.preventDefault();
          event.stopPropagation();
          const wrapper = reactFlowWrapper.current?.getBoundingClientRect();
          const baseX = wrapper ? event.clientX - wrapper.left : event.clientX;
          const baseY = wrapper ? event.clientY - wrapper.top : event.clientY;
          setSelectedEdge(edge);
          setEdgeActionPos({ x: baseX, y: baseY });
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={() => {
          setSelectedEdge(null);
          setEdgeActionPos(null);
        }}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.Step}
        connectionLineStyle={{ stroke: '#ff6a00', strokeWidth: 1.9, strokeDasharray: '6 5' }}
        connectOnClick
        fitView
        snapToGrid
        snapGrid={snapGrid}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={proOptions}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#d4d4d8"
          gap={20}
          size={1}
        />
        <Panel position="top-right">
          <CanvasToolbar />
        </Panel>
      </ReactFlow>
      {selectedEdge && edgeActionPos ? (
        <button
          type="button"
          onClick={removeSelectedEdge}
          className="absolute z-[120] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 shadow-md hover:bg-red-50"
          style={{ left: edgeActionPos.x, top: edgeActionPos.y }}
        >
          Remove connection
        </button>
      ) : null}
    </div>
  );
};

const FlowBuilder = () => (
  <ReactFlowProvider>
    <FlowBuilderInner />
  </ReactFlowProvider>
);

export default FlowBuilder;
