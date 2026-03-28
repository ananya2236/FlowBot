"use client";
import React, { useCallback, useRef, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  ConnectionMode,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import GroupNode, { createBlockFromSidebar } from './GroupNode';
import StartNode from './StartNode';
import PreviewModal from '../Preview/PreviewModal';
import useStore from '@/lib/store';

import { Maximize2, Minimize2, Lock, Unlock, Play } from 'lucide-react';

const nodeTypes = {
  group: GroupNode,
  start: StartNode,
};

const FlowBuilderInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [isLocked, setIsLocked] = useState(false);
  
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'default',
    animated: false,
    style: { stroke: '#d4d4d8', strokeWidth: 2 },
  }), []);

  const snapGrid: [number, number] = useMemo(() => [12, 12], []);

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
        snapGrid={snapGrid}
        defaultEdgeOptions={defaultEdgeOptions}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          color="#d4d4d8" 
          gap={20} 
          size={1.2} 
        />
        <Controls className="!bg-white !border-slate-200 !shadow-sm" />
        <Panel position="top-right" className="flex flex-col items-end gap-3 pointer-events-none">
          {/* Main Action Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button 
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              <Play size={12} className="text-white fill-white" />
              Test
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95">
              Publish
            </button>
          </div>

          {/* Canvas Controls */}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-sm pointer-events-auto">
            <div className="flex items-center gap-1 px-1 border-r border-slate-100 mr-1">
              <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors" title="Minimize"><Minimize2 size={14} /></button>
              <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-black transition-colors" title="Maximize"><Maximize2 size={14} /></button>
            </div>
            <button 
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase tracking-wider ${isLocked ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-400 hover:text-black'}`}
              title={isLocked ? 'Unlock' : 'Lock'}
            >
              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
            </button>
          </div>
        </Panel>
      </ReactFlow>
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </div>
  );
};

const FlowBuilder = () => (
  <ReactFlowProvider>
    <FlowBuilderInner />
  </ReactFlowProvider>
);

export default FlowBuilder;
