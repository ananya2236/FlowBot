"use client";
import React, { useCallback, useRef, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import GroupNode, { createBlockFromSidebar } from './GroupNode';
import StartNode from './StartNode';
import PreviewModal from '../Preview/PreviewModal';
import useStore from '@/lib/store';

const nodeTypes = {
  group: GroupNode,
  start: StartNode,
};

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

      const block = createBlockFromSidebar(type);
      if (!block) return;

      const groupsCount = bots.find(b => b.id === activeBotId)?.nodes.filter(n => n.type === 'group').length || 0;

      addNode('group', position, {
        title: `Group #${groupsCount + 1}`,
        blocks: [block],
        bubbles: block.kind === 'bubble' ? [{ id: block.id, type: block.type, content: block.content, meta: block.meta }] : [],
        inputs: block.kind === 'input' ? [{ id: block.id, type: block.type, variable: block.variable, placeholder: block.placeholder }] : [],
      });
    },
    [screenToFlowPosition, addNode, bots, activeBotId]
  );

  const activeBot = bots.find(b => b.id === activeBotId);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'default',
    animated: false,
    style: { stroke: '#d4d4d8', strokeWidth: 2 },
  }), []);

  const snapGrid: [number, number] = useMemo(() => [12, 12], []);

  return (
    <div className="w-full h-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={activeBot?.nodes || []}
        edges={activeBot?.edges || []}
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
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="#d4d4d8"
          gap={20}
          size={1}
        />
        <Controls position="top-right" />
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
