import { Template, NodeType } from '../types';

export const DEFAULT_TEMPLATES: Template[] = [
    {
        id: 'empty',
        name: 'Empty Project',
        description: 'Start from scratch with a clean slate.',
        previewImage: undefined,
        data: {
            name: 'New Project',
            resolution: 512,
            nodes: [
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
                id: 'node-output',
                type: 'outputNode', // Special type for final output
                position: { x: 950, y: 300 },
                data: { 
                  label: 'Material Output', 
                  type: NodeType.OUTPUT, 
                  params: {} 
                },
              },
            ],
            edges: [
              { id: 'e1', source: 'node-rect', sourceHandle: 'out', target: 'node-mult', targetHandle: 'a' },
              { id: 'e2', source: 'node-circle', sourceHandle: 'out', target: 'node-mult', targetHandle: 'b' },
              { id: 'e3', source: 'node-mult', sourceHandle: 'out', target: 'node-output', targetHandle: 'in' },
            ]
        }
    }
];