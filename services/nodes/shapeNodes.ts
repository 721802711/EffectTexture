
import { NodeType } from '../../types';
import { getRectPath, getEllipsePath, getStarPath, getWavyPath, getBeamPath } from '../../utils/shapeUtils';
import { SVGResult, generateId } from './svgUtils';

export function processShapeNode(type: NodeType, params: any, resolution: number): SVGResult {
  let defs: string[] = [];
  
  // Center shapes in the viewbox
  const cx = resolution / 2;
  const cy = resolution / 2;
  
  let rawPath = '';
  let transform = `translate(${cx}, ${cy})`;

  switch (type) {
    case NodeType.RECTANGLE: {
      const w = params.width ?? 300;
      const h = params.height ?? 300;
      rawPath = getRectPath(w, h, {
        tl: params.rTL ?? 0,
        tr: params.rTR ?? 0,
        br: params.rBR ?? 0,
        bl: params.rBL ?? 0
      });
      // Rectangle path logic in getRectPath is 0,0 based top-left, so we offset
      transform = `translate(${cx - w/2}, ${cy - h/2})`;
      break;
    }
    case NodeType.CIRCLE: {
      const w = params.width ?? 300;
      const h = params.height ?? 300;
      rawPath = getEllipsePath(0, 0, w/2, h/2);
      break;
    }
    case NodeType.POLYGON: {
      const pts = params.points ?? 5;
      const outer = params.outerRadius ?? 100;
      const inner = params.innerRadius ?? 50;
      rawPath = getStarPath(0, 0, pts, outer, inner);
      break;
    }
    case NodeType.WAVY_RING: {
      const r = params.radius ?? 100;
      const freq = params.frequency ?? 10;
      const amp = params.amplitude ?? 10;
      rawPath = getWavyPath(r, freq, amp);
      break;
    }
    case NodeType.BEAM: {
      const len = params.length ?? 250;
      const topW = params.topWidth ?? 5;
      const btmW = params.bottomWidth ?? 100;
      rawPath = getBeamPath(len, topW, btmW);
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
  } else {
    // --- General Case: Default to Solid White ---
    // Users can use the "Fill" node to modify this.
    fillAttr = 'fill="white"';
    strokeAttr = 'stroke="none"';
  }

  return {
      xml: `<g transform="${transform}"><path d="${rawPath}" ${fillAttr} ${strokeAttr} /></g>`,
      defs: defs
  };
}
