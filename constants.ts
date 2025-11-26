
import { NodeType, TextureNode, TextureEdge } from './types';

export const INITIAL_NODES: TextureNode[] = [
  {
    id: 'node-rect',
    type: NodeType.RECTANGLE,
    position: { x: 100, y: 100 },
    data: { 
      label: 'Rectangle', 
      type: NodeType.RECTANGLE, 
      params: { width: 300, height: 300 } 
    },
  },
  {
    id: 'node-circle',
    type: NodeType.CIRCLE,
    position: { x: 100, y: 550 },
    data: { 
      label: 'Circle', 
      type: NodeType.CIRCLE, 
      params: { width: 300, height: 300 } 
    },
  },
  {
    id: 'node-mult',
    type: NodeType.MULTIPLY,
    position: { x: 550, y: 325 },
    data: { 
      label: 'Multiply (A * B)', 
      type: NodeType.MULTIPLY, 
      params: {} 
    },
  },
  {
    id: 'node-polar',
    type: NodeType.POLAR,
    position: { x: 820, y: 325 },
    data: { 
      label: 'Polar Coords', 
      type: NodeType.POLAR, 
      params: { type: 'rect_to_polar' } 
    },
  },
  {
    id: 'node-output',
    type: 'outputNode', // Special type for final output
    position: { x: 1150, y: 300 },
    data: { 
      label: 'Material Output', 
      type: NodeType.OUTPUT, 
      params: {} 
    },
  },
];

export const INITIAL_EDGES: TextureEdge[] = [
  { id: 'e1', source: 'node-rect', sourceHandle: 'out', target: 'node-mult', targetHandle: 'a' },
  { id: 'e2', source: 'node-circle', sourceHandle: 'out', target: 'node-mult', targetHandle: 'b' },
  { id: 'e3', source: 'node-mult', sourceHandle: 'out', target: 'node-polar', targetHandle: 'in' },
  { id: 'e4', source: 'node-polar', sourceHandle: 'out', target: 'node-output', targetHandle: 'in' },
];

export const PREVIEW_RES = 512;
