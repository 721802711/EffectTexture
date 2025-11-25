
import { NodeType } from '../../types';
import { SVGResult } from './svgUtils';

export function processMathNode(
  type: NodeType, 
  params: any, 
  resolution: number, 
  inputA: SVGResult | null,
  inputB: SVGResult | null
): SVGResult {
  
  // Math nodes combine two visuals.
  // In Canvas, we manipulated pixels. In SVG/CSS, we use mix-blend-mode.

  const A = inputA ? inputA.xml : '';
  const B = inputB ? inputB.xml : ''; // If no B, usually treat as black/white depending on op.
  
  // Combine Defs
  const defs = (inputA?.defs || '') + (inputB?.defs || '');

  let blendMode = 'normal';

  switch (type) {
    case NodeType.ADD:
      blendMode = 'lighten'; // or 'plus-lighter' if supported, 'screen' is common for light addition
      // 'linear-dodge' is closest to Add, which corresponds to 'plus-lighter' in CSS, but 'screen' or 'lighten' are safer.
      // Let's use 'screen' or 'lighten' for visual "Adding light".
      blendMode = 'screen'; 
      break;
    case NodeType.SUBTRACT:
      // Subtract is hard in CSS blend modes (no direct 'subtract'). 
      // difference/exclusion are close but not exact.
      // For a "Light Lab", usually we don't subtract much.
      // Difference is the closest standard mode.
      blendMode = 'difference'; 
      break;
    case NodeType.MULTIPLY:
      blendMode = 'multiply';
      break;
    case NodeType.DIVIDE:
      // No divide blend mode. 
      // Fallback: Overlay or Normal
      blendMode = 'overlay'; 
      break;
  }

  // To blend B onto A:
  return {
      xml: `
        <g>
          ${A}
          <g style="mix-blend-mode: ${blendMode}">
            ${B}
          </g>
        </g>
      `,
      defs: defs
  };
}
