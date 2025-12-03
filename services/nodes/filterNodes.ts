
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

export async function processLayerBlurNode(
  params: any,
  resolution: number,
  input: SVGResult | null
): Promise<SVGResult> {
  if (!input) return { xml: '', defs: [] };

  const radius = params.radius ?? 20;
  const pA = params.pointA || { x: 0.5, y: 0 }; // Start (Sharp)
  const pB = params.pointB || { x: 0.5, y: 1 }; // End (Blurry)

  // 1. Rasterize input to a high-res bitmap
  let srcUrl = '';
  try {
    srcUrl = await svgToDataUrl(input.xml, input.defs, resolution, resolution, resolution);
  } catch (e) {
    console.error("Layer Blur rasterization failed", e);
    return input;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) { resolve(input); return; }

        // Draw Base (Sharp)
        ctx.drawImage(img, 0, 0);

        const x1 = pA.x * resolution;
        const y1 = pA.y * resolution;
        const x2 = pB.x * resolution;
        const y2 = pB.y * resolution;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 1 || radius < 0.5) {
             // Points are too close or radius is 0, just return the sharp base
        } else {
             // --- GRADIENT STACKING TECHNIQUE ---
             // Instead of slicing (which causes hard edges), we stack layers of increasing blur.
             // Each layer is masked by a gradient that transitions it from invisible to visible.
             // This effectively "accumulates" blur smoothly across the distance.
             
             const STEPS = 16; // 16 overlapping gradient layers for seamless transition
             
             // Helper canvas for creating the masked blur layers
             const maskCanvas = document.createElement('canvas');
             maskCanvas.width = resolution;
             maskCanvas.height = resolution;
             const maskCtx = maskCanvas.getContext('2d'); // GPU accelerated if possible
             
             if (maskCtx) {
                 for(let i=1; i<=STEPS; i++) {
                     const tStart = (i - 1) / STEPS; 
                     const tEnd = i / STEPS;
                     
                     // Current blur amount for this layer
                     const currentBlur = (i / STEPS) * radius;

                     // 1. Draw the Gradient Mask on Temp Canvas
                     // The gradient goes from Transparent (before tStart) to Opaque (after tEnd).
                     // This ensures the new blur layer smoothly fades in over the previous one.
                     maskCtx.globalCompositeOperation = 'source-over';
                     maskCtx.clearRect(0, 0, resolution, resolution);
                     
                     const gStart = { x: x1 + dx * tStart, y: y1 + dy * tStart };
                     const gEnd = { x: x1 + dx * tEnd, y: y1 + dy * tEnd };
                     
                     // Linear gradient ensures smooth alpha blend
                     const grad = maskCtx.createLinearGradient(gStart.x, gStart.y, gEnd.x, gEnd.y);
                     grad.addColorStop(0, 'rgba(0,0,0,0)');
                     grad.addColorStop(1, 'rgba(0,0,0,1)');
                     
                     maskCtx.fillStyle = grad;
                     maskCtx.fillRect(0, 0, resolution, resolution);
                     
                     // 2. Composite the Blurred Image into the Mask
                     // 'source-in' keeps the Blurred Image ONLY where the Gradient is opaque.
                     maskCtx.globalCompositeOperation = 'source-in';
                     maskCtx.filter = `blur(${currentBlur}px)`;
                     maskCtx.drawImage(img, 0, 0);
                     maskCtx.filter = 'none';

                     // 3. Draw the masked blur layer onto Main Canvas
                     // 'source-over' stacks it on top of the previous result.
                     ctx.drawImage(maskCanvas, 0, 0);
                 }
             }
        }

        const dataUrl = canvas.toDataURL('image/png');
        resolve({
            xml: `<image href="${dataUrl}" x="0" y="0" width="${resolution}" height="${resolution}" preserveAspectRatio="none" />`,
            defs: []
        });
    };
    
    img.onerror = (e) => {
        console.error("Layer Blur image load error", e);
        resolve(input);
    };
    
    img.src = srcUrl;
  });
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
