"use client";
import React, { useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from './MessageNode';
import QuestionNode from './QuestionNode';
import useStore from '@/lib/store';

const nodeTypes = {
  message: MessageNode,
  question: QuestionNode,
  text: MessageNode,
  image: MessageNode,
  video: MessageNode,
  audio: MessageNode,
  text_input: QuestionNode,
  email: QuestionNode,
  phone: QuestionNode,
  number: QuestionNode,
  date: QuestionNode,
  buttons: QuestionNode,
  condition: QuestionNode,
  redirect: QuestionNode,
  webhook: QuestionNode,
  trigger: QuestionNode,
  google_sheets: QuestionNode,
};

const FlowBuilderInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,
    activeBotId,
    bots
  } = useStore();
  
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const activeBot = bots.find(b => b.id === activeBotId);

  return (
    <div className="w-full h-full relative group" ref={reactFlowWrapper}>
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
        snapGrid={[12, 12]}
        style={{ background: '#09090b' }}
        defaultEdgeOptions={{
          style: { stroke: '#FF6A00', strokeWidth: 3 },
          animated: true,
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          color="#18181b" 
          gap={24} 
          size={1.5} 
        />
        <Controls className="!bg-zinc-900 !border-zinc-800 !shadow-2xl fill-white !rounded-xl overflow-hidden" />
        <MiniMap 
          nodeColor="#27272a" 
          maskColor="rgba(9, 9, 11, 0.8)"
          className="!bg-zinc-900/80 !border-zinc-800 !rounded-2xl backdrop-blur-md"
        />
        <Panel position="bottom-center" className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-2xl text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] shadow-2xl">
          Spinabot Canvas <span className="text-accent ml-2">Live</span>
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
