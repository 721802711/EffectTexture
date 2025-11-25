
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
                id: 'node-output',
                type: 'outputNode',
                position: { x: 400, y: 200 },
                data: { label: 'Material Output', type: NodeType.OUTPUT, params: {} },
              },
            ],
            edges: []
        }
    }
];
