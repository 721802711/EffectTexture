import { NodeType, TextureNode } from './types';

export const INITIAL_NODES: TextureNode[] = [
  {
    id: 'node-output',
    type: 'outputNode', // Special type for final output
    position: { x: 400, y: 200 },
    data: { 
      label: 'Material Output', 
      type: NodeType.OUTPUT, 
      params: {} 
    },
  },
];

export const INITIAL_EDGES = [];

export const PREVIEW_RES = 512;