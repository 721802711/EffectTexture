
export interface SVGResult {
  xml: string;
  defs: string; // For <filter>, <linearGradient>, etc.
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
