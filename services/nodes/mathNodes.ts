
import { NodeType } from '../../types';
import { SVGResult, generateId } from './svgUtils';

export function processMathNode(
  type: NodeType, 
  params: any, 
  resolution: number, 
  inputA: SVGResult | null,
  inputB: SVGResult | null
): SVGResult {
  
  const A = inputA ? inputA.xml : '';
  const B = inputB ? inputB.xml : ''; 
  
  const defs = [...(inputA?.defs || []), ...(inputB?.defs || [])];

  let innerXml = '';

  switch (type) {
    case NodeType.ADD:
      // Union (A U B) with Color Add
      // Reference: clamp(C1 + C2). 
      // 'plus-lighter' adds the RGB components, handling the "Color Add" requirement.
      innerXml = `
        <g>
          ${A}
          <g style="mix-blend-mode: plus-lighter">
            ${B}
          </g>
        </g>
      `;
      break;

    case NodeType.SUBTRACT:
      // Difference (A - B)
      // Logic: A Masked by Inverse B.
      // We must ensure B acts as a solid black silhouette in the mask to properly hide A,
      // regardless of B's original color (e.g. if B is yellow, it shouldn't act as 'light' in the mask).
      {
          const maskId = generateId('diffMask');
          const blackenId = generateId('blacken');
          
          // Filter to turn any color into black, preserving alpha
          defs.push(`
            <filter id="${blackenId}">
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            </filter>
          `);

          defs.push(`
            <mask id="${maskId}">
              <!-- 1. Fill mask with White (Show everything) -->
              <rect x="-100%" y="-100%" width="300%" height="300%" fill="white" />
              <!-- 2. Draw B in Black using filter (Hide B) -->
              <g filter="url(#${blackenId})">
                ${B}
              </g>
            </mask>
          `);

          innerXml = `
            <g mask="url(#${maskId})">
              ${A}
            </g>
          `;
      }
      break;

    case NodeType.MULTIPLY:
      // Intersection (A n B)
      // Logic: Strict CSG Intersection.
      // We enforce that pixels are visible ONLY where both A and B exist.
      // 1. Clip A using B's shape.
      // 2. Clip B using A's shape.
      // 3. Blend them with Multiply.
      {
          const maskBId = generateId('maskB'); // Mask created FROM B (to apply to A)
          const maskAId = generateId('maskA'); // Mask created FROM A (to apply to B)
          const whitenId = generateId('whiten');
          
          // Filter to turn any color into white, preserving alpha
          // This ensures the shape acts as a robust opacity mask regardless of its color.
          defs.push(`
            <filter id="${whitenId}">
              <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
            </filter>
          `);

          // Mask of B (Show where B is)
          defs.push(`
            <mask id="${maskBId}">
              <rect x="-100%" y="-100%" width="300%" height="300%" fill="black" />
              <g filter="url(#${whitenId})">
                ${B}
              </g>
            </mask>
          `);

          // Mask of A (Show where A is)
          defs.push(`
            <mask id="${maskAId}">
              <rect x="-100%" y="-100%" width="300%" height="300%" fill="black" />
              <g filter="url(#${whitenId})">
                ${A}
              </g>
            </mask>
          `);

          innerXml = `
            <g>
              <!-- Layer 1: A, but only where B exists -->
              <g mask="url(#${maskBId})">
                ${A}
              </g>
              <!-- Layer 2: B, but only where A exists, blended on top -->
              <g mask="url(#${maskAId})" style="mix-blend-mode: multiply">
                ${B}
              </g>
            </g>
          `;
      }
      break;

    case NodeType.DIVIDE:
      // Exclusion (A XOR B)
      // Logic: Exclusion blend mode calculates A + B - 2(A*B).
      // Geometric: 1 + 1 - 2 = 0 (Hole in overlap). 1 + 0 = 1 (Keep non-overlap).
      // Color: XOR effect.
      innerXml = `
        <g>
          ${A}
          <g style="mix-blend-mode: exclusion">
            ${B}
          </g>
        </g>
      `;
      break;
  }

  return {
      xml: `<g style="isolation: isolate">${innerXml}</g>`,
      defs: defs
  };
}
