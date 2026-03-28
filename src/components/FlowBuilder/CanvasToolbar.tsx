"use client";
import React from 'react';
import { useReactFlow, useStore as useRFStore } from 'reactflow';
import {
  Settings,
  Copy,
  Trash2,
  Minus,
  Plus,
  Maximize,
  Code2,
} from 'lucide-react';
import useStore from '@/lib/store';

export default function CanvasToolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { onNodesChange } = useStore();

  // Get selected node count from ReactFlow internal store
  const selectedNodeCount = useRFStore(
    (state) => state.getNodes().filter((n: any) => n.selected).length
  );
  const selectedNodes = useRFStore(
    (state) => state.getNodes().filter((n: any) => n.selected)
  );

  const handleDeleteSelected = () => {
    if (selectedNodes.length === 0) return;
    const changes = selectedNodes.map((n: any) => ({ type: 'remove' as const, id: n.id }));
    onNodesChange(changes);
  };

  const handleDuplicateSelected = () => {
    if (selectedNodes.length === 0) return;
    const { addNode } = useStore.getState();
    for (const node of selectedNodes) {
      addNode(node.type || 'group', {
        x: node.position.x + 40,
        y: node.position.y + 40,
      }, { ...node.data });
    }
  };

  return (
    <div className="canvas-toolbar">
      {/* Selection info + actions */}
      {selectedNodeCount > 0 && (
        <div className="toolbar-section selection-section">
          <span className="selection-badge">{selectedNodeCount} selected</span>
          <button
            onClick={() => {}}
            className="toolbar-btn"
            title="Settings"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={handleDuplicateSelected}
            className="toolbar-btn"
            title="Duplicate"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDeleteSelected}
            className="toolbar-btn toolbar-btn-danger"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Zoom controls */}
      <div className="toolbar-section zoom-section">
        <button onClick={() => fitView({ padding: 0.3 })} className="toolbar-btn" title="Fold">
          <Code2 size={14} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <button onClick={() => fitView({ padding: 0.3 })} className="toolbar-btn" title="Unfold">
          <Code2 size={14} style={{ transform: 'rotate(-90deg)' }} />
        </button>
        <div className="toolbar-divider" />
        <button onClick={() => zoomOut()} className="toolbar-btn" title="Zoom out">
          <Minus size={14} />
        </button>
        <button onClick={() => zoomIn()} className="toolbar-btn" title="Zoom in">
          <Plus size={14} />
        </button>
        <button onClick={() => fitView({ padding: 0.2 })} className="toolbar-btn" title="Fit view">
          <Maximize size={14} />
        </button>
      </div>
    </div>
  );
}
