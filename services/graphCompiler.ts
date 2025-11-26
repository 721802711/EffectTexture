
import { TextureNode, TextureEdge, NodeType } from '../types';
import { PREVIEW_RES } from '../constants';
import { SVGResult } from './nodes/svgUtils';
import { processShapeNode } from './nodes/shapeNodes';
import { processInputNode } from './nodes/inputNodes';
import { processMathNode } from './nodes/mathNodes';
import { processFilterNode, processPixelateNode } from './nodes/filterNodes';
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
  resolution: number = PREVIEW_RES,
  rootNodeId?: string // Optional: Render graph ending at this node
): Promise<string> => {
  
  // 1. Find Root Node (Output or Specific Node)
  let rootNode: TextureNode | undefined;
  
  if (rootNodeId) {
    rootNode = nodes.find(n => n.id === rootNodeId);
  } else {
    rootNode = nodes.find(n => n.data.type === NodeType.OUTPUT);
  }

  if (!rootNode) return '';

  const RES = resolution;

  // 2. Cache stores SVGResult objects { xml, defs }
  const cache: Record<string, SVGResult> = {};

  // 3. Recursive Processor (Async to support Rasterization)
  const processNode = async (nodeId: string): Promise<SVGResult> => {
    if (cache[nodeId]) return cache[nodeId];

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { xml: '', defs: [] };

    const params = node.data.params;
    
    // Helper to get inputs (Async)
    const getConnectedResult = async (handleId: string): Promise<SVGResult | null> => {
      const incomingEdge = edges.find(e => 
        e.target === nodeId && 
        e.targetHandle === handleId
      );
      if (!incomingEdge) return null;
      return await processNode(incomingEdge.source);
    };

    let result: SVGResult = { xml: '', defs: [] };

    switch (node.data.type) {
      
      // --- SHAPES (Generators) ---
      case NodeType.RECTANGLE:
      case NodeType.CIRCLE:
      case NodeType.POLYGON:
      case NodeType.WAVY_RING:
      case NodeType.BEAM:
        result = processShapeNode(node.data.type, params, RES);
        break;

      // --- INPUTS & PATTERNS ---
      case NodeType.COLOR:
      case NodeType.VALUE:
      case NodeType.ALPHA:
      case NodeType.IMAGE:
      case NodeType.GRADIENT:
        // Inputs might depend on 'in' (e.g. Tinting)
        result = processInputNode(node.data.type, params, RES, await getConnectedResult('in'));
        break;

      // --- MATH ---
      case NodeType.ADD:
      case NodeType.SUBTRACT:
      case NodeType.MULTIPLY:
      case NodeType.DIVIDE:
        result = processMathNode(node.data.type, params, RES, 
          await getConnectedResult('a'), 
          await getConnectedResult('b')
        );
        break;

      // --- FILTERS ---
      case NodeType.FILL:
      case NodeType.GLOW:
      case NodeType.NEON:
      case NodeType.SOFT_BLUR:
      case NodeType.STROKE:
      case NodeType.GRADIENT_FADE:
        result = processFilterNode(node.data.type, params, RES, await getConnectedResult('in'));
        break;

      case NodeType.PIXELATE:
        // This is async because it uses Canvas to rasterize
        result = await processPixelateNode(params, RES, await getConnectedResult('in'));
        break;

      // --- TRANSFORMS ---
      case NodeType.TRANSLATE:
      case NodeType.ROTATE:
      case NodeType.SCALE:
      case NodeType.POLAR:
        // Now awaited as transforms can be async (e.g. Polar rasterization)
        result = await processTransformNode(node.data.type, params, RES, await getConnectedResult('in'));
        break;

      // --- OUTPUT ---
      case NodeType.OUTPUT: {
        const input = await getConnectedResult('in');
        if (input) {
          result = input;
        } else {
            // Empty state placeholder
            result = {
                xml: `
                  <rect width="100%" height="100%" fill="#111" />
                  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="24">No Input</text>
                `,
                defs: []
            };
        }
        break;
      }
      
      default:
        result = { xml: '', defs: [] };
    }

    cache[nodeId] = result;
    return result;
  };

  const finalResult = await processNode(rootNode.id);
  
  // 4. Construct Final SVG String
  // Deduplicate definitions (prevent ID conflicts in filters)
  const uniqueDefs = Array.from(new Set(finalResult.defs)).join('\n');

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${RES} ${RES}" width="${RES}" height="${RES}">
      <defs>
        ${uniqueDefs}
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
  resolution: number,
  rootNodeId?: string
): Promise<string> => {
  // 1. Get SVG Blob URL
  const svgUrl = await generateTextureGraph(nodes, edges, resolution, rootNodeId);

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
