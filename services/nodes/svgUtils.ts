
export interface SVGResult {
  xml: string;
  defs: string[]; // Changed to array for deduplication
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export function ensureHexColor(val: any): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
      const r = (val.r !== undefined) ? val.r : 255;
      const g = (val.g !== undefined) ? val.g : 255;
      const b = (val.b !== undefined) ? val.b : 255;
      // Convert RGB to Hex for SVG attributes (cleaner than rgba)
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  return '#ffffff';
}

export function ensureOpacity(val: any): number {
    if (val && typeof val === 'object' && val.a !== undefined) return val.a;
    return 1;
}

/**
 * Renders an SVG fragment into a PNG Data URL via an offscreen Canvas.
 * This effectively "bakes" the vector graphics into pixels.
 */
export async function svgToDataUrl(
  xml: string, 
  defs: string[], 
  renderWidth: number, 
  renderHeight: number,
  originalResolution: number
): Promise<string> {
    const uniqueDefs = Array.from(new Set(defs)).join('\n');
    
    // We construct a standalone SVG.
    // We set width/height to the render target (e.g. low res for pixelation),
    // but viewBox to the original resolution so vectors scale down automatically.
    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${originalResolution} ${originalResolution}" width="${renderWidth}" height="${renderHeight}">
      <defs>${uniqueDefs}</defs>
      ${xml}
    </svg>`; 

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not create canvas"));
                return;
            }
            // Draw the SVG onto the canvas
            ctx.drawImage(img, 0, 0, renderWidth, renderHeight);
            
            // Convert to PNG Data URL
            resolve(canvas.toDataURL('image/png'));
            URL.revokeObjectURL(url);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG for rasterization"));
        };
        img.src = url;
    });
}
