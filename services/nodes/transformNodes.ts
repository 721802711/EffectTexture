
import { NodeType } from '../../types';
import { SVGResult, svgToDataUrl } from './svgUtils';

interface PolarParams {
  resolution: number;
  type: 'rect_to_polar' | 'polar_to_rect';
  offsetX: number;
  offsetY: number;
  radialScale: number;
  angularScale: number;
}

/**
 * Rasterizes the input SVG and applies Polar Coordinate transformation
 * using direct pixel manipulation on an HTML5 Canvas.
 */
async function processPolarCanvas(srcUrl: string, params: PolarParams): Promise<string> {
  const { resolution, type, offsetX, offsetY, radialScale, angularScale } = params;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        resolve(srcUrl); // Fallback
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0, resolution, resolution);
      
      const srcImageData = ctx.getImageData(0, 0, resolution, resolution);
      const dstImageData = ctx.createImageData(resolution, resolution);
      
      const srcPixels = srcImageData.data;
      const dstPixels = dstImageData.data;

      // Pixel Processing Loop
      for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
          
          // 1. Normalized output coordinates (0..1)
          const u = x / resolution;
          const v = y / resolution;

          // 2. Calculate Polar Coordinates relative to the center
          // Apply offset to center calculation
          const dx = u - 0.5 + offsetX;
          const dy = v - 0.5 + offsetY;

          // Distance from center
          const len = Math.sqrt(dx * dx + dy * dy);
          
          // Radius: len * 2 ensures that distance 0.5 (edge of unit circle) maps to 1.0
          const radius = len * 2 * radialScale;

          // Angle: Standard atan2 (Top-aligned logic)
          // Math.atan2(dy, dx) + PI/2 aligns 0 to the top.
          let angle = Math.atan2(dy, dx) + Math.PI / 2;
          
          // Normalize to 0..1
          angle = angle / (2 * Math.PI);
          
          // Apply Scale
          angle *= angularScale;

          // Wrap Angle
          angle = angle - Math.floor(angle);
          if (angle < 0) angle += 1;

          // 3. Determine Source (Target) UVs based on mapping mode
          let targetU = 0;
          let targetV = 0;

          if (type === 'polar_to_rect') {
             // Polar to Rect (Ring effect): 
             // Source X <- Radius
             // Source Y <- Angle
             targetU = radius;
             targetV = angle;
          } else {
             // Rect to Polar (Burst effect):
             // Source X <- Angle
             // Source Y <- Radius
             targetU = angle;
             targetV = radius;
          }

          // 4. Sample Source Pixel
          // Check bounds
          if (targetU >= 0 && targetU < 1 && targetV >= 0 && targetV < 1) {
             const srcX = Math.floor(targetU * (resolution - 1));
             const srcY = Math.floor(targetV * (resolution - 1));
             const srcIdx = (srcY * resolution + srcX) * 4;
             const dstIdx = (y * resolution + x) * 4;

             dstPixels[dstIdx] = srcPixels[srcIdx];     // R
             dstPixels[dstIdx + 1] = srcPixels[srcIdx + 1]; // G
             dstPixels[dstIdx + 2] = srcPixels[srcIdx + 2]; // B
             dstPixels[dstIdx + 3] = srcPixels[srcIdx + 3]; // A
          }
        }
      }

      ctx.putImageData(dstImageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error("Failed to load image for Polar processing"));
    img.crossOrigin = "Anonymous";
    img.src = srcUrl;
  });
}

export async function processTransformNode(
  type: NodeType, 
  params: any, 
  resolution: number, 
  input: SVGResult | null
): Promise<SVGResult> {
  if (!input) return { xml: '', defs: [] };

  const cx = resolution / 2;
  const cy = resolution / 2;

  switch (type) {
    case NodeType.TRANSLATE: {
      const x = (params.x ?? 0) * resolution;
      const y = (params.y ?? 0) * resolution;
      return {
          xml: `<g transform="translate(${x}, ${y})">${input.xml}</g>`,
          defs: input.defs
      };
    }

    case NodeType.ROTATE: {
      const angle = params.angle ?? 0;
      return {
          xml: `<g transform="rotate(${angle}, ${cx}, ${cy})">${input.xml}</g>`,
          defs: input.defs
      };
    }

    case NodeType.SCALE: {
      const s = params.scale ?? 1;
      return {
          xml: `<g transform="translate(${cx}, ${cy}) scale(${s}) translate(-${cx}, -${cy})">${input.xml}</g>`,
          defs: input.defs
      };
    }

    case NodeType.POLAR: {
      // 1. Rasterize Input to Data URL
      let srcUrl = '';
      try {
        srcUrl = await svgToDataUrl(input.xml, input.defs, resolution, resolution, resolution);
      } catch (e) {
        console.error("Polar node failed to rasterize input", e);
        return input;
      }

      // 2. Apply Pixel Manipulation
      const processedUrl = await processPolarCanvas(srcUrl, {
        resolution,
        type: params.type || 'rect_to_polar',
        offsetX: params.x ?? 0,
        offsetY: params.y ?? 0,
        radialScale: params.radialScale ?? 1,
        angularScale: params.angularScale ?? 1
      });
      
      // 3. Return as SVG Image
      return {
          xml: `<image href="${processedUrl}" x="0" y="0" width="${resolution}" height="${resolution}" preserveAspectRatio="none" />`,
          defs: [] // Definitions are baked into the pixels
      };
    }
  }

  return input;
}
