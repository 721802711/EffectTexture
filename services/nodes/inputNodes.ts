
import { NodeType } from '../../types';
import { SVGResult, ensureHexColor, ensureOpacity, generateId } from './svgUtils';

export function processInputNode(
  type: NodeType, 
  params: any, 
  resolution: number, 
  input: SVGResult | null
): SVGResult {
  
  switch (type) {
    case NodeType.COLOR: {
      const color = ensureHexColor(params);
      const opacity = ensureOpacity(params);
      
      if (input) {
        // Tinting existing shape
        return {
            xml: `
              <g>
                ${input.xml}
                <rect x="0" y="0" width="${resolution}" height="${resolution}" fill="${color}" fill-opacity="${opacity}" style="mix-blend-mode: multiply; pointer-events: none;" />
              </g>
            `,
            defs: input.defs
        };
      } else {
        // Just a solid color block
        return {
            xml: `<rect x="0" y="0" width="${resolution}" height="${resolution}" fill="${color}" fill-opacity="${opacity}" />`,
            defs: []
        };
      }
    }
    case NodeType.VALUE: {
      // Grayscale block
      const v = Math.floor((params.value ?? 0.5) * 255);
      const hex = `rgb(${v},${v},${v})`;
      return {
          xml: `<rect x="0" y="0" width="${resolution}" height="${resolution}" fill="${hex}" />`,
          defs: []
      };
    }
    case NodeType.ALPHA: {
      const alpha = params.value ?? 1;
      
      if (input) {
        // Wrap the input in a group and apply opacity
        return {
            xml: `<g opacity="${alpha}">${input.xml}</g>`,
            defs: input.defs
        };
      }
      
      // Fallback: White block with varying opacity
      return {
          xml: `<rect x="0" y="0" width="${resolution}" height="${resolution}" fill="white" fill-opacity="${alpha}" />`,
          defs: []
      };
    }
    case NodeType.IMAGE: {
      const src = params.imageSrc || '';
      if (!src) return { xml: '', defs: [] };
      
      // Return SVG Image Element
      // preserveAspectRatio="none" ensures it stretches to fill the resolution (standard for texture inputs)
      return {
        xml: `<image href="${src}" x="0" y="0" width="${resolution}" height="${resolution}" preserveAspectRatio="none" />`,
        defs: []
      }
    }

    case NodeType.GRADIENT: {
      const stops = params.stops || [
        { offset: 0, color: '#000000', opacity: 1 },
        { offset: 1, color: '#ffffff', opacity: 1 }
      ];

      // Geometry parameters
      const xDir = params.x ?? 1; // -1 to 1
      const yDir = params.y ?? 0; // -1 to 1
      const power = params.power ?? 1; // 1 = linear, <1 logarithmic, >1 exponential

      // Sort stops by offset to ensure valid SVG gradient structure
      const sortedStops = [...stops].sort((a: any, b: any) => a.offset - b.offset);

      const gradId = generateId('linearGrad');
      
      // Calculate coordinates based on vector direction relative to center (0.5, 0.5)
      // Standard SVG linearGradient uses percentage 'x1, y1' etc.
      // A vector (1, 0) means Left -> Right.
      // Start = Center - Vector/2. End = Center + Vector/2.
      // Scaling factor 0.707 (1/sqrt2) roughly ensures corners are covered during 45deg rotation, 
      // but simple +/- 0.5 works for basic cardinal directions.
      // We'll normalize roughly so max extension covers canvas.
      
      const cx = 0.5;
      const cy = 0.5;
      
      // Calculate start and end points
      // Note: We multiply by 0.5 so that a full '1' value goes from edge to edge (0 to 1)
      const x1 = (cx - xDir * 0.5) * 100;
      const y1 = (cy - yDir * 0.5) * 100;
      const x2 = (cx + xDir * 0.5) * 100;
      const y2 = (cy + yDir * 0.5) * 100;

      const stopTags = sortedStops.map((stop: any) => {
        // Apply Power (Gamma) to the offset
        // New Offset = OriginalOffset ^ Power
        // If Power > 1 (e.g. 2), 0.5 becomes 0.25 (pushes gradient toward start)
        const adjustedOffset = Math.pow(stop.offset, power) * 100;
        
        return `<stop offset="${adjustedOffset}%" stop-color="${stop.color}" stop-opacity="${stop.opacity ?? 1}" />`;
      }).join('\n');

      const def = `
        <linearGradient id="${gradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
          ${stopTags}
        </linearGradient>
      `;

      return {
        xml: `<rect x="0" y="0" width="${resolution}" height="${resolution}" fill="url(#${gradId})" />`,
        defs: [def]
      };
    }
  }

  return { xml: '', defs: [] };
}
