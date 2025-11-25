import { TextureNode, TextureEdge, NodeType } from '../types';
import { PREVIEW_RES } from '../constants';
import { SVGResult } from './nodes/svgUtils';
import { processShapeNode } from './nodes/shapeNodes';
import { processInputNode } from './nodes/inputNodes';
import { processMathNode } from './nodes/mathNodes';
import { processFilterNode } from './nodes/filterNodes';
import { processTransformNode } from './nodes/transformNodes';

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates an SVG string instead of a Raster Image.
 * This utilizes the GPU/Browser Compositor for rendering (Filters, Blends)
 * which provides real-time performance compared to Canvas 2D CPU processing.
 */
export const generateTextureGraph = async (
  nodes: TextureNode[],
  edges: TextureEdge[],
  overrideResolution?: number
): Promise<string> => {
  
  // 1. Find Output
  const outputNode = nodes.find(n => n.data.type === NodeType.OUTPUT);
  if (!outputNode) return '';

  const RES = overrideResolution || (outputNode.data.params.resolution ? parseInt(outputNode.data.params.resolution) : PREVIEW_RES);

  // 2. Cache stores SVGResult objects { xml, defs }
  const cache: Record<string, SVGResult> = {};

  // 3. Recursive Processor
  const processNode = (nodeId: string): SVGResult => {
    if (cache[nodeId]) return cache[nodeId];

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { xml: '', defs: '' };

    const params = node.data.params;
    
    // Helper to get inputs
    const getConnectedResult = (handleId: string): SVGResult | null => {
      const incomingEdge = edges.find(e => 
        e.target === nodeId && 
        e.targetHandle === handleId
      );
      if (!incomingEdge) return null;
      return processNode(incomingEdge.source);
    };

    let result: SVGResult = { xml: '', defs: '' };

    switch (node.data.type) {
      
      // --- SHAPES (Generators) ---
      case NodeType.RECTANGLE:
      case NodeType.CIRCLE:
      case NodeType.POLYGON:
      case NodeType.WAVY_RING:
      case NodeType.BEAM:
        result = processShapeNode(node.data.type, params, RES);
        break;

      // --- INPUTS ---
      case NodeType.COLOR:
      case NodeType.VALUE:
        result = processInputNode(node.data.type, params, RES, getConnectedResult('in'));
        break;

      // --- MATH ---
      case NodeType.ADD:
      case NodeType.SUBTRACT:
      case NodeType.MULTIPLY:
      case NodeType.DIVIDE:
        result = processMathNode(node.data.type, params, RES, 
          getConnectedResult('a'), 
          getConnectedResult('b')
        );
        break;

      // --- FILTERS ---
      case NodeType.FILL:
      case NodeType.GLOW:
      case NodeType.NEON:
      case NodeType.SOFT_BLUR:
      case NodeType.STROKE:
      case NodeType.GRADIENT_FADE:
        result = processFilterNode(node.data.type, params, RES, getConnectedResult('in'));
        break;

      // --- TRANSFORMS ---
      case NodeType.TRANSLATE:
      case NodeType.ROTATE:
      case NodeType.SCALE:
        result = processTransformNode(node.data.type, params, RES, getConnectedResult('in'));
        break;

      // --- OUTPUT ---
      case NodeType.OUTPUT: {
        const input = getConnectedResult('in');
        if (input) {
          result = input;
        } else {
            // Empty state placeholder
            result = {
                xml: `
                  <rect width="100%" height="100%" fill="#111" />
                  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="24">No Input</text>
                `,
                defs: ''
            };
        }
        break;
      }
      
      default:
        result = { xml: '', defs: '' };
    }

    cache[nodeId] = result;
    return result;
  };

  const finalResult = processNode(outputNode.id);
  
  // 4. Construct Final SVG String
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RES} ${RES}" width="${RES}" height="${RES}">
      <defs>
        ${finalResult.defs}
      </defs>
      
      <!-- Background (Dark void) -->
      <rect width="100%" height="100%" fill="#050505" />
      
      <!-- Content -->
      ${finalResult.xml}
    </svg>
  `;

  // 5. Convert to Blob URL (High performance, no base64 overhead)
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
};

/**
 * Renders the SVG graph onto a Canvas and returns a PNG Data URL.
 * This ensures that SVG filters (blur, blend modes) are "baked" into the pixels.
 */
export const generateTexturePNG = async (
  nodes: TextureNode[],
  edges: TextureEdge[],
  resolution: number
): Promise<string> => {
  // 1. Get SVG Blob URL
  const svgUrl = await generateTextureGraph(nodes, edges, resolution);

  // 2. Load into Image and Draw to Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, resolution, resolution);
      
      // 3. Export as PNG
      const pngUrl = canvas.toDataURL('image/png');
      
      // Cleanup
      URL.revokeObjectURL(svgUrl);
      resolve(pngUrl);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(svgUrl);
      reject(err);
    };
    
    img.src = svgUrl;
  });
};