import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, { 
  Background, 
  MiniMap,
  ConnectionMode,
  NodeTypes,
  ReactFlowInstance,
  BackgroundVariant
} from 'reactflow';
import { useStore } from '../store';
import { nodeTypes } from './nodes/CustomNodes';
import { NodeType, TextureNode } from '../types';

const defaultViewport = { x: 0, y: 0, zoom: 1 };

const GraphEditor: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,
    triggerRender,
    interactionMode 
  } = useStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Initial Render
  useEffect(() => {
    triggerRender();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Manual snap for dropped nodes
      const SNAP_GRID = 20;
      position.x = Math.round(position.x / SNAP_GRID) * SNAP_GRID;
      position.y = Math.round(position.y / SNAP_GRID) * SNAP_GRID;

      const newNode: TextureNode = {
        id: `node_${type}_${Date.now()}`,
        type: type, // Matches keys in nodeTypes
        position,
        data: { 
          label: `${type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')}`, 
          type: type, 
          params: {} 
        },
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  return (
    <div className="w-full h-full bg-[#0e0e10]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes as unknown as NodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={defaultViewport}
        onDragOver={onDragOver}
        onDrop={onDrop}
        
        // Grid Snapping
        snapToGrid={true}
        snapGrid={[20, 20]}
        
        // Deletion
        deleteKeyCode={['Backspace', 'Delete']}
        
        // Infinite Canvas Settings
        minZoom={0.05}
        maxZoom={5}
        fitView
        
        // Interaction Modes
        panOnScroll={false} // Use wheel for zoom
        zoomOnScroll={true} 
        
        // Pan Config: 
        // If Hand mode: Allow Left(0), Middle(1), Right(2) to pan.
        // If Select mode: Only Middle(1) and Right(2) pan. Left(0) triggers selection.
        panOnDrag={interactionMode === 'hand' ? [0, 1, 2] : [1, 2]}
        selectionOnDrag={interactionMode === 'select'}
        
        proOptions={{ hideAttribution: true }}
        className="touch-none"
      >
        <Background 
          color="#444" 
          gap={20} 
          size={1} 
          variant={BackgroundVariant.Dots} 
          className="opacity-25"
        />
        
        <MiniMap 
          nodeColor={() => '#4a5568'} 
          maskColor="rgba(0,0,0, 0.6)"
          className="bg-[#1a1a1d] border border-gray-800 rounded-lg !bottom-4 !right-4" 
        />
      </ReactFlow>
    </div>
  );
};

export default GraphEditor;