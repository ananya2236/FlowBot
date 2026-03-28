"use client";
import React, { useCallback, useRef, useMemo, useState } from 'react';
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
import GroupNode from './GroupNode';
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
    updateNodeData 
  } = useStore();

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

      // Check if dropped onto existing node for embedding (Inputs only)
      const nodes = bots.find(b => b.id === activeBotId)?.nodes || [];
      const targetNode = nodes.find(node => {
        const nodePos = node.position;
        // Check if cursor is within the node boundaries (approximate)
        return (
          position.x >= nodePos.x &&
          position.x <= nodePos.x + 320 &&
          position.y >= nodePos.y &&
          position.y <= nodePos.y + 200
        );
      });

      if (targetNode && type.startsWith('input_') && targetNode.type === 'group') {
        const inputType = type.replace('input_', '');
        const currentInputs = targetNode.data.inputs || [];
        updateNodeData(targetNode.id, {
          inputs: [
            ...currentInputs,
            {
              id: Math.random().toString(36).substr(2, 9),
              type: inputType,
              variable: `user_${inputType}_${currentInputs.length + 1}`,
              placeholder: `Enter ${inputType}...`
            }
          ]
        });
        return;
      }

      // Initialize Group with correct data structure
      let initialData: any = {};
      const groupsCount = bots.find(b => b.id === activeBotId)?.nodes.filter(n => n.type === 'group').length || 0;
      const groupTitle = `Group #${groupsCount + 1}`;

      if (type === 'bubble') {
        initialData = { 
          title: groupTitle,
          bubbles: [{ id: Math.random().toString(36).substr(2, 9), type: 'text', content: 'Hello!' }],
          inputs: []
        };
      } else if (type.startsWith('input_')) {
        const inputType = type.replace('input_', '');
        initialData = { 
          title: groupTitle,
          bubbles: [],
          inputs: [{ 
            id: Math.random().toString(36).substr(2, 9),
            type: inputType, 
            variable: `user_${inputType}_1`, 
            placeholder: `Enter ${inputType}...` 
          }]
        };
      } else if (['image', 'video', 'audio', 'embed'].includes(type)) {
        initialData = { 
          title: groupTitle,
          bubbles: [{ id: Math.random().toString(36).substr(2, 9), type: type as any, content: '' }],
          inputs: []
        };
      }

      addNode('group', position, initialData);
    },
    [screenToFlowPosition, addNode, updateNodeData, bots, activeBotId]
  );

  const activeBot = bots.find(b => b.id === activeBotId);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    style: { stroke: '#94A3B8', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#94A3B8' }
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
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          color="#E2E8F0" 
          gap={24} 
          size={1} 
        />
        <Controls className="!bg-white !border-slate-200 !shadow-sm" />
        <MiniMap 
          nodeColor="#F8FAFC" 
          maskColor="rgba(255, 255, 255, 0.6)"
          className="!bg-white !border-slate-200 !rounded-xl !shadow-sm"
        />
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
