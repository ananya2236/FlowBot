"use client";
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import GroupNode from './GroupNode';
import StartNode from './StartNode';
import CanvasToolbar from './CanvasToolbar';
import useStore from '@/lib/store';
import { createDefaultBlock, createGroupData, sanitizeFlowEdges } from '@/lib/blocks';

const nodeTypes = {
  group: GroupNode,
  start: StartNode,
};

const proOptions = { hideAttribution: true };
const emptyNodes: never[] = [];
const emptyEdges: never[] = [];

const FlowBuilderInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  
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
  const safeEdges = useMemo(() => {
    if (!activeBot) return [];
    return sanitizeFlowEdges(activeBot.edges, activeBot.nodes);
  }, [activeBot]);

  useEffect(() => {
    if (!activeBot) return;
    if (safeEdges.length === activeBot.edges.length) return;
    setEdges(safeEdges);
  }, [activeBot, safeEdges, setEdges]);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'default',
    animated: false,
    style: { stroke: '#d4d4d8', strokeWidth: 2 },
  }), []);

  const snapGrid: [number, number] = useMemo(() => [12, 12], []);

  return (
    <div className="w-full h-full min-h-0 relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={activeBot?.nodes || emptyNodes}
        edges={safeEdges || emptyEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
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
    </div>
  );
};

const FlowBuilder = () => (
  <ReactFlowProvider>
    <FlowBuilderInner />
  </ReactFlowProvider>
);

export default FlowBuilder;
