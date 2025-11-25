
export function getBlankCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

export function ensureColor(val: any): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') {
      const r = (val.r !== undefined && !isNaN(val.r)) ? val.r : 255;
      const g = (val.g !== undefined && !isNaN(val.g)) ? val.g : 255;
      const b = (val.b !== undefined && !isNaN(val.b)) ? val.b : 255;
      const a = (val.a !== undefined && !isNaN(val.a)) ? val.a : 1;
      return `rgba(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)},${a})`;
  }
  return 'rgba(255,255,255,1)';
}
