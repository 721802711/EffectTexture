
import { NodeType } from '../../types';
import { getRectPath, getEllipsePath, getStarPath, getWavyPath, getBeamPath, getSplinePath, getBezierPath } from '../../utils/shapeUtils';
import { SVGResult, generateId } from './svgUtils';
import { PREVIEW_RES } from '../../constants';

export function processShapeNode(type: NodeType, params: any, resolution: number): SVGResult {
  let defs: string[] = [];
  
  // Center shapes in the viewbox
  const cx = resolution / 2;
  const cy = resolution / 2;
  
  // Calculate Scale Factor (Current Resolution / Base Design Resolution)
  // This ensures a 300px rectangle in 512px canvas becomes 600px in 1024px canvas.
  const scale = resolution / PREVIEW_RES;

  let rawPath = '';
  // Default transform centers the coordinate system. 
  // Nodes that handle their own coordinates (Pen, Path) should set this to null/empty string.
  let transform = `translate(${cx}, ${cy})`;

  switch (type) {
    case NodeType.RECTANGLE: {
      const w = (params.width ?? 300) * scale;
      const h = (params.height ?? 300) * scale;
      rawPath = getRectPath(w, h, {
        tl: (params.rTL ?? 0) * scale,
        tr: (params.rTR ?? 0) * scale,
        br: (params.rBR ?? 0) * scale,
        bl: (params.rBL ?? 0) * scale
      });
      // Offset top-left to center
      transform = `translate(${cx - w/2}, ${cy - h/2})`;
      break;
    }
    case NodeType.CIRCLE: {
      const w = (params.width ?? 300) * scale;
      const h = (params.height ?? 300) * scale;
      rawPath = getEllipsePath(0, 0, w/2, h/2);
      break;
    }
    case NodeType.POLYGON: {
      const pts = params.points ?? 5;
      const outer = (params.outerRadius ?? 100) * scale;
      const inner = (params.innerRadius ?? 50) * scale;
      rawPath = getStarPath(0, 0, pts, outer, inner);
      break;
    }
    case NodeType.WAVY_RING: {
      const r = (params.radius ?? 100) * scale;
      const freq = params.frequency ?? 10; // Frequency is a count, doesn't scale
      const amp = (params.amplitude ?? 10) * scale;
      rawPath = getWavyPath(r, freq, amp);
      break;
    }
    case NodeType.BEAM: {
      const len = (params.length ?? 250) * scale;
      const topW = (params.topWidth ?? 5) * scale;
      const btmW = (params.bottomWidth ?? 100) * scale;
      rawPath = getBeamPath(len, topW, btmW);
      break;
    }
    case NodeType.PATH: {
      // Legacy Path Node (Spline) - Uses normalized coordinates (0-1), so it scales automatically via `resolution`.
      const points = Array.isArray(params.points) ? params.points : [];
      let tension: number | { inner: number, outer: number } = params.tension ?? 0;
      
      if (params.tensionInner !== undefined || params.tensionOuter !== undefined) {
         tension = {
             inner: params.tensionInner ?? (params.tension ?? 0),
             outer: params.tensionOuter ?? (params.tension ?? 0)
         };
      }
      
      const renderPoints = points.length > 0 ? points
        .filter((p: any) => p && typeof p.x === 'number')
        .map((p: any) => ({
          x: p.x * resolution,
          y: p.y * resolution,
          type: p.type 
        })) : [
          { x: 0.5 * resolution, y: 0.2 * resolution, type: 'outer' },
          { x: 0.8 * resolution, y: 0.8 * resolution, type: 'inner' },
          { x: 0.2 * resolution, y: 0.8 * resolution, type: 'inner' }
        ];

      rawPath = getSplinePath(renderPoints, tension, true);
      transform = ''; 
      break;
    }
    case NodeType.PEN: {
      // New Pen Tool Node (Bezier) - Uses normalized coordinates (0-1), so it scales automatically.
      const points = Array.isArray(params.points) ? params.points : [];
      
      const scaledPoints = points
        .filter((p: any) => p && typeof p.x === 'number' && typeof p.y === 'number')
        .map((p: any) => {
            const px = p.x * resolution;
            const py = p.y * resolution;
            
            const hInX = typeof p.handleIn?.x === 'number' ? p.handleIn.x * resolution : px;
            const hInY = typeof p.handleIn?.y === 'number' ? p.handleIn.y * resolution : py;
            
            const hOutX = typeof p.handleOut?.x === 'number' ? p.handleOut.x * resolution : px;
            const hOutY = typeof p.handleOut?.y === 'number' ? p.handleOut.y * resolution : py;

            return {
                x: px,
                y: py,
                handleIn: { x: hInX, y: hInY },
                handleOut: { x: hOutX, y: hOutY }
            };
        });
      
      rawPath = getBezierPath(scaledPoints, true);
      transform = '';
      break;
    }
  }

  // --- Construct SVG Attributes based on type logic ---
  let fillAttr = 'fill="white"';
  let strokeAttr = 'stroke="none"';

  if (type === NodeType.BEAM) {
    // --- Special Case: Beam ---
    const gradId = generateId('beamGrad');
    defs.push(`
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="60%" stop-color="white" stop-opacity="0.2" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
      </linearGradient>
    `);
    fillAttr = `fill="url(#${gradId})"`;
    strokeAttr = 'stroke="none"';
  } else if (type === NodeType.PEN || type === NodeType.PATH) {
    // --- Special Case: Pen/Path ---
    fillAttr = 'fill="white"';
    strokeAttr = 'stroke="white" stroke-width="2" stroke-linejoin="round"';
  } else {
    fillAttr = 'fill="white"';
    strokeAttr = 'stroke="none"';
  }

  const transformAttr = transform ? `transform="${transform}"` : '';

  return {
      xml: `<g ${transformAttr}><path d="${rawPath}" ${fillAttr} ${strokeAttr} /></g>`,
      defs: defs
  };
}
