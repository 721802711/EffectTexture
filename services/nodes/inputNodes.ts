
import { NodeType } from '../../types';
import { SVGResult, ensureHexColor, ensureOpacity } from './svgUtils';

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
      
      // If there is an input (shape), we tint it (change its fill).
      // In SVG, we can just wrap it in a group with fill="..." 
      // HOWEVER, inner styles override outer styles.
      // A robust way is to use 'currentcolor' logic or just basic CSS override if the inner doesn't have inline styles.
      // For this system, we assume Generators produce shapes with `fill` attributes. 
      // We can override them by using a filter or mask, OR simpler:
      // Since our shapes return <path fill="...">, we can replace the fill string, 
      // OR we can rely on `fill` inheritance if we generated shapes without fill.
      // BUT, shapes default to white.
      
      // Strategy: Use <g fill="color"> but this might fail if path has explicit fill.
      // Strategy 2: Use Mix Blend Mode 'multiply' with a colored rect on top?
      // User expects "Color" node to "Tint" or "Set Color".
      
      if (input) {
        // Tinting existing shape
        // We use a group with mix-blend-mode multiply for tinting behavior
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
            defs: ''
        };
      }
    }
    case NodeType.VALUE: {
      // Grayscale block
      const v = Math.floor((params.value ?? 0.5) * 255);
      const hex = `rgb(${v},${v},${v})`;
      return {
          xml: `<rect x="0" y="0" width="${resolution}" height="${resolution}" fill="${hex}" />`,
          defs: ''
      };
    }
  }

  return { xml: '', defs: '' };
}
