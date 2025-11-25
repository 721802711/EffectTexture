import { NodeType } from '../../types';
import { SVGResult, generateId, ensureHexColor, ensureOpacity } from './svgUtils';

export function processFilterNode(
  type: NodeType, 
  params: any, 
  resolution: number, 
  input: SVGResult | null
): SVGResult {
  if (!input) return { xml: '', defs: '' };

  switch (type) {
    case NodeType.FILL: {
      const fillEnabled = params.fillEnabled ?? true;
      const strokeWidth = params.strokeWidth ?? 0;
      
      const fillAttr = fillEnabled ? 'white' : 'none';
      const strokeAttr = (strokeWidth > 0 || !fillEnabled) ? 'white' : 'none';
      const widthAttr = strokeWidth > 0 ? strokeWidth : 1;

      let newXml = input.xml;
      
      // Robustly replace attributes on common shape tags.
      // 1. Remove existing presentation attributes to prevent conflicts
      //    We match attribute="value" preceded by whitespace
      const attributesToRemove = ['fill', 'stroke', 'stroke-width'];
      attributesToRemove.forEach(attr => {
          const re = new RegExp(`\\s${attr}="[^"]*"`, 'g');
          newXml = newXml.replace(re, ' '); // Replace with space to maintain separation
      });

      // 2. Inject new attributes into common shapes
      //    We match the opening tag <tag followed by whitespace, slash, or closing bracket.
      const tags = ['path', 'rect', 'circle', 'polygon', 'ellipse'];
      tags.forEach(tag => {
         const re = new RegExp(`<${tag}(\\s|/|>)`, 'g'); 
         // Inject attributes immediately after tag name
         newXml = newXml.replace(re, `<${tag} fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="${widthAttr}"$1`);
      });

      return {
        xml: newXml,
        defs: input.defs
      };
    }

    case NodeType.GLOW: {
      const radius = (params.radius ?? 20);
      const intensity = (params.intensity ?? 1.5);
      const filterId = generateId('glow');
      
      const layer1 = 10 + radius;      // Wide atmosphere
      const layer2 = radius / 3;       // Core glow
      
      // We use feColorMatrix to apply the intensity gain to the blur layers.
      // Matrix scales the Alpha channel by 'intensity'.
      // Then we merge the boosted blurs with the source.
      
      const defs = `
        <filter id="${filterId}" x="-200%" y="-200%" width="500%" height="500%">
            <!-- Source graphic stays sharp (Hard Glow) -->
            
            <!-- Blur Layers -->
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer1}" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer2}" result="blur2" />
            
            <!-- Merge blurs -->
            <feMerge result="mergedBlurs">
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
            </feMerge>

            <!-- Apply Intensity (Amplify Alpha) -->
            <feColorMatrix in="mergedBlurs" type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${intensity} 0" 
                result="amplifiedBlur" 
            />
            
            <!-- Final Merge: Amplified Blur + Source (Source on top = Hard core) -->
            <feMerge>
                <feMergeNode in="amplifiedBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      `;
      
      return {
        xml: `<g filter="url(#${filterId})">${input.xml}</g>`,
        defs: input.defs + defs
      };
    }

    case NodeType.NEON: {
      // Very similar to Hard Glow, but maybe tuned for "Neon" look
      // Source stays sharp, overlaying a colored or bright blur.
      const radius = (params.radius ?? 15);
      const intensity = (params.intensity ?? 2);
      const filterId = generateId('neon');
      
      const layer1 = radius;           // Outer glow
      const layer2 = radius / 4;       // Tight glow
      
      const defs = `
        <filter id="${filterId}" x="-200%" y="-200%" width="500%" height="500%">
            <!-- Source graphic stays sharp (Neon Tube) -->
            
            <!-- Blur Layers -->
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer1}" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer2}" result="blur2" />
            
            <!-- Merge blurs -->
            <feMerge result="mergedBlurs">
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
            </feMerge>

            <!-- Apply Intensity (Amplify Alpha) -->
            <feColorMatrix in="mergedBlurs" type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${intensity} 0" 
                result="amplifiedBlur" 
            />
            
            <!-- Final Merge: Amplified Blur + Source (Source on top) -->
            <feMerge>
                <feMergeNode in="amplifiedBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      `;
      
      return {
        xml: `<g filter="url(#${filterId})">${input.xml}</g>`,
        defs: input.defs + defs
      };
    }
    
    case NodeType.SOFT_BLUR: {
      const radius = params.radius ?? 5;
      const filterId = generateId('blur');
      
      const defs = `
        <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${radius}" />
        </filter>
      `;
      
      return {
        xml: `<g filter="url(#${filterId})">${input.xml}</g>`,
        defs: input.defs + defs
      };
    }

    case NodeType.STROKE: {
      const width = params.width ?? 1;
      const opacity = params.opacity ?? 1;
      
      let newXml = input.xml;
      
      // Remove existing stroke attributes
      const attributesToRemove = ['stroke', 'stroke-width', 'stroke-opacity'];
      attributesToRemove.forEach(attr => {
          const re = new RegExp(`\\s${attr}="[^"]*"`, 'g');
          newXml = newXml.replace(re, ' '); 
      });

      // Inject new attributes
      const tags = ['path', 'rect', 'circle', 'polygon', 'ellipse'];
      tags.forEach(tag => {
         const re = new RegExp(`<${tag}(\\s|/|>)`, 'g'); 
         newXml = newXml.replace(re, `<${tag} stroke="white" stroke-width="${width}" stroke-opacity="${opacity}"$1`);
      });

      return {
        xml: newXml,
        defs: input.defs
      };
    }

    case NodeType.GRADIENT_FADE: {
      const directionDeg = params.direction ?? 90; 
      const start = params.start ?? 1;
      const end = params.end ?? 0;
      
      const maskId = generateId('fadeMask');
      const gradId = generateId('fadeGrad');
      
      const defs = `
        <linearGradient id="${gradId}" gradientTransform="rotate(${directionDeg - 90} .5 .5)">
            <stop offset="0%" stop-color="white" stop-opacity="${start}" />
            <stop offset="100%" stop-color="white" stop-opacity="${end}" />
        </linearGradient>
        <mask id="${maskId}">
            <rect x="-100%" y="-100%" width="300%" height="300%" fill="url(#${gradId})" />
        </mask>
      `;

      return {
          xml: `<g mask="url(#${maskId})">${input.xml}</g>`,
          defs: input.defs + defs
      };
    }
  }

  return input;
}