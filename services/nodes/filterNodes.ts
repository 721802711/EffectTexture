
import { NodeType } from '../../types';
import { SVGResult, generateId, ensureHexColor, ensureOpacity, svgToDataUrl } from './svgUtils';

export async function processPixelateNode(
  params: any,
  resolution: number,
  input: SVGResult | null
): Promise<SVGResult> {
  if (!input) return { xml: '', defs: [] };

  const pixelSize = Math.max(1, params.pixelSize ?? 1);
  
  // Calculate the resolution to render at.
  // If pixelSize is 1, we render at full resolution (Rasterize/Bake).
  // If pixelSize > 1, we render at a smaller resolution (Pixelate).
  const renderW = Math.max(1, Math.floor(resolution / pixelSize));
  const renderH = Math.max(1, Math.floor(resolution / pixelSize));

  try {
    const dataUrl = await svgToDataUrl(input.xml, input.defs, renderW, renderH, resolution);
    
    return {
      // Return an image tag that uses "image-rendering: pixelated" to keep hard edges when scaled up
      xml: `<image href="${dataUrl}" x="0" y="0" width="${resolution}" height="${resolution}" preserveAspectRatio="none" style="image-rendering: pixelated" />`,
      defs: [] // Definitions are baked into the image
    };
  } catch (e) {
    console.error("Pixelation failed", e);
    return input; // Fallback
  }
}

export function processFilterNode(
  type: NodeType, 
  params: any, 
  resolution: number, 
  input: SVGResult | null
): SVGResult {
  if (!input) return { xml: '', defs: [] };

  switch (type) {
    case NodeType.FILL: {
      const fillEnabled = params.fillEnabled ?? true;
      const strokeWidth = params.strokeWidth ?? 0;
      
      const fillAttr = fillEnabled ? 'white' : 'none';
      const strokeAttr = (strokeWidth > 0 || !fillEnabled) ? 'white' : 'none';
      const widthAttr = strokeWidth > 0 ? strokeWidth : 1;

      let newXml = input.xml;
      
      const attributesToRemove = ['fill', 'stroke', 'stroke-width'];
      attributesToRemove.forEach(attr => {
          const re = new RegExp(`\\s${attr}="[^"]*"`, 'g');
          newXml = newXml.replace(re, ' '); 
      });

      const tags = ['path', 'rect', 'circle', 'polygon', 'ellipse'];
      tags.forEach(tag => {
         const re = new RegExp(`<${tag}(\\s|/|>)`, 'g'); 
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
      
      const layer1 = 10 + radius;      
      const layer2 = radius / 3;       
      
      const newDef = `
        <filter id="${filterId}" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer1}" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer2}" result="blur2" />
            <feMerge result="mergedBlurs">
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
            </feMerge>
            <feColorMatrix in="mergedBlurs" type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${intensity} 0" 
                result="amplifiedBlur" 
            />
            <feMerge>
                <feMergeNode in="amplifiedBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      `;
      
      return {
        xml: `<g filter="url(#${filterId})">${input.xml}</g>`,
        defs: [...input.defs, newDef]
      };
    }

    case NodeType.NEON: {
      const radius = (params.radius ?? 15);
      const intensity = (params.intensity ?? 2);
      const filterId = generateId('neon');
      
      const layer1 = radius;           
      const layer2 = radius / 4;       
      
      const newDef = `
        <filter id="${filterId}" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer1}" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="${layer2}" result="blur2" />
            <feMerge result="mergedBlurs">
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
            </feMerge>
            <feColorMatrix in="mergedBlurs" type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 ${intensity} 0" 
                result="amplifiedBlur" 
            />
            <feMerge>
                <feMergeNode in="amplifiedBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      `;
      
      return {
        xml: `<g filter="url(#${filterId})">${input.xml}</g>`,
        defs: [...input.defs, newDef]
      };
    }
    
    case NodeType.SOFT_BLUR: {
      const radius = params.radius ?? 5;
      const filterId = generateId('blur');
      
      const newDef = `
        <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${radius}" />
        </filter>
      `;
      
      return {
        xml: `<g filter="url(#${filterId})">${input.xml}</g>`,
        defs: [...input.defs, newDef]
      };
    }

    case NodeType.STROKE: {
      const width = params.width ?? 1;
      const opacity = params.opacity ?? 1;
      
      let newXml = input.xml;
      
      const attributesToRemove = ['stroke', 'stroke-width', 'stroke-opacity'];
      attributesToRemove.forEach(attr => {
          const re = new RegExp(`\\s${attr}="[^"]*"`, 'g');
          newXml = newXml.replace(re, ' '); 
      });

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
      
      const newDef = `
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
          defs: [...input.defs, newDef]
      };
    }
  }

  return input;
}
