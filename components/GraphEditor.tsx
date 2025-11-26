
import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, { 
  Background, 
  MiniMap,
  ConnectionMode,
  NodeTypes,
  ReactFlowInstance,
  BackgroundVariant,
  useViewport,
  Panel
} from 'reactflow';
import { useStore } from '../store';
import { nodeTypes } from './nodes/CustomNodes';
import { NodeType, TextureNode } from '../types';

const defaultViewport = { x: 0, y: 0, zoom: 1 };

const ZoomDisplay = () => {
  const { zoom } = useViewport();
  return (
    <Panel position="bottom-left" className="!mb-4 !ml-4">
      <div className="bg-[#1a1a1d]/90 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-400 px-3 py-1.5 rounded-full font-mono shadow-lg select-none">
        {Math.round(zoom * 100)}%
      </div>
    </Panel>
  );
};

const GraphEditor: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode,
    triggerRender,
    interactionMode,
    viewportResetTrigger,
    setContextMenu 
  } = useStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Initial Render
  useEffect(() => {
    triggerRender();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset Viewport on Project Load
  useEffect(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
    }
  }, [viewportResetTrigger, reactFlowInstance]);

  // Space Key Handler for Context Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        
        if (reactFlowInstance) {
          const { x, y } = mousePosRef.current;
          const flowPos = reactFlowInstance.screenToFlowPosition({ x, y });
          
          setContextMenu({
            x,
            y,
            flowX: flowPos.x,
            flowY: flowPos.y
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reactFlowInstance, setContextMenu]);

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

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault(); // Prevent native browser context menu
      
      if (reactFlowInstance) {
          // Get flow coordinates for node creation
          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });

          // Set context menu state
          setContextMenu({
              x: event.clientX,
              y: event.clientY,
              flowX: position.x,
              flowY: position.y
          });
      }
    },
    [reactFlowInstance, setContextMenu]
  );

  return (
    <div 
      className="w-full h-full bg-[#0e0e10] isolation-isolate"
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={(e) => {
        mousePosRef.current = { x: e.clientX, y: e.clientY };
      }}
    >
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
        
        // Context Menu Handler (Right Click)
        onPaneContextMenu={onPaneContextMenu}

        // Grid Snapping
        snapToGrid={true}
        snapGrid={[20, 20]}
        
        // Deletion
        deleteKeyCode={['Backspace', 'Delete']}
        
        // Infinite Canvas Settings
        minZoom={0.05}
        maxZoom={5}
        
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

        <ZoomDisplay />
      </ReactFlow>
    </div>
  );
};

export default GraphEditor;
