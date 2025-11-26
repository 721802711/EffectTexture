
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

/**
 * Generate a Smooth Closed Spline Path (Catmull-Rom style)
 * Points are expected to be in format [{x,y}, {x,y}...]
 * tension can be a single number (0-1) or an object { inner: number, outer: number }
 */
export function getSplinePath(
  points: {x: number, y: number, type?: 'inner'|'outer'}[], 
  tension: number | { inner: number, outer: number } = 0.5, 
  closed: boolean = true
) {
  if (points.length < 2) return "";

  // Helper to resolve tension for a specific point
  const getTension = (p: { type?: 'inner'|'outer' }) => {
    if (typeof tension === 'number') return tension;
    // Default to outer tension if type is missing or 'outer'
    if (p.type === 'inner') return tension.inner;
    return tension.outer;
  };

  // If tension is effectively 0 for everything, return linear
  if (typeof tension === 'number' && tension <= 0.01) {
    return "M " + points.map(p => `${p.x} ${p.y}`).join(" L ") + (closed ? " Z" : "");
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  // Loop through points
  for (let i = 0; i < points.length; i++) {
    // Indices for Previous, Current, Next, NextNext
    // We wrap indices if closed
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    
    if (!closed && i === points.length - 1) break;

    const p_1 = points[(i - 1 + points.length) % points.length]; // Prev
    const p2 = points[(i + 2) % points.length]; // Next Next

    // Calculate Control Points (Tangents)
    // The curve leaving p0 is influenced by p0's tension
    // The curve entering p1 is influenced by p1's tension
    
    const t0 = getTension(p0);
    const t1 = getTension(p1);

    // Vector P_1 -> P1 determines tangent at P0
    const t0x = (p1.x - p_1.x) * t0 * 0.25; 
    const t0y = (p1.y - p_1.y) * t0 * 0.25;

    // Vector P0 -> P2 determines tangent at P1
    const t1x = (p2.x - p0.x) * t1 * 0.25;
    const t1y = (p2.y - p0.y) * t1 * 0.25;

    // Cubic Bezier: M p0 C (p0+t0) (p1-t1) p1
    path += ` C ${p0.x + t0x} ${p0.y + t0y}, ${p1.x - t1x} ${p1.y - t1y}, ${p1.x} ${p1.y}`;
  }

  if (closed) path += " Z";
  return path;
}
