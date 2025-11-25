
/**
 * Generate a Super Rectangle Path (Rect, Rounded, Squircle, Arch, Leaf)
 */
export function getRectPath(w: number, h: number, r: { tl?: number, tr?: number, br?: number, bl?: number } = {}) {
  const { tl = 0, tr = 0, br = 0, bl = 0 } = r;

  return `
    M ${tl} 0
    L ${w - tr} 0
    A ${tr} ${tr} 0 0 1 ${w} ${tr}
    L ${w} ${h - br}
    A ${br} ${br} 0 0 1 ${w - br} ${h}
    L ${bl} ${h}
    A ${bl} ${bl} 0 0 1 0 ${h - bl}
    L 0 ${tl}
    A ${tl} ${tl} 0 0 1 ${tl} 0
    Z
  `.replace(/\n/g, ' ');
}

/**
 * Generate Polygon or Star Path
 */
export function getStarPath(cx: number, cy: number, points: number, outerR: number, innerR: number) {
  let path = "";
  const totalPoints = points * 2; 
  
  for (let i = 0; i < totalPoints; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    
    if (i === 0) {
      path += `M ${x} ${y}`;
    } else {
      path += ` L ${x} ${y}`;
    }
  }
  
  path += " Z";
  return path;
}

/**
 * Generate Ellipse/Circle Path
 */
export function getEllipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `
    M ${cx - rx} ${cy}
    A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}
    A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}
    Z
  `;
}

/**
 * Generate Wavy Ring Path
 */
export function getWavyPath(r: number, freq: number, amp: number) {
  let path = "";
  const steps = 360; 
  for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const curR = r + Math.sin(angle * freq) * amp;
      const x = curR * Math.cos(angle);
      const y = curR * Math.sin(angle);
      path += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
  }
  path += " Z";
  return path;
}

/**
 * Generate Beam Trapezoid Path
 */
export function getBeamPath(len: number, topW: number, btmW: number) {
  const hLen = len / 2;
  const hTop = topW / 2;
  const hBtm = btmW / 2;
  // Tip points up (negative Y in standard cartesian, but here we center it)
  return `M ${-hTop} ${-hLen} L ${hTop} ${-hLen} L ${hBtm} ${hLen} L ${-hBtm} ${hLen} Z`;
}