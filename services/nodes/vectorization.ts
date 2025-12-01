
import { SVGResult, svgToDataUrl } from './svgUtils';

/**
 * Perform a simple Marching Squares to convert a bitmap to an SVG Path.
 * This is a lightweight implementation for client-side usage.
 */

// Lookup table for Marching Squares (16 states)
// Coordinates for edges: 0=Top, 1=Right, 2=Bottom, 3=Left
// Optimized for Clockwise winding (Filled on Right) to allow proper filling.
const CASES = [
    [], // 0: Empty
    [[0, 0.5, 0.5, 1]], // 1 (BL): Left -> Bottom
    [[0.5, 1, 1, 0.5]], // 2 (BR): Bottom -> Right
    [[0, 0.5, 1, 0.5]], // 3 (BL+BR): Left -> Right
    [[1, 0.5, 0.5, 0]], // 4 (TR): Right -> Top
    [[0, 0.5, 0.5, 1], [1, 0.5, 0.5, 0]], // 5 (BL+TR): Left->Bottom, Right->Top
    [[0.5, 1, 0.5, 0]], // 6 (BR+TR): Bottom -> Top
    [[0, 0.5, 0.5, 0]], // 7 (Not TL): Left -> Top
    [[0.5, 0, 0, 0.5]], // 8 (TL): Top -> Left
    [[0.5, 0, 0.5, 1]], // 9 (TL+BL): Top -> Bottom
    [[0.5, 0, 0, 0.5], [0.5, 1, 1, 0.5]], // 10 (TL+BR): Top->Left, Bottom->Right
    [[0.5, 0, 1, 0.5]], // 11 (Not TR): Top -> Right
    [[1, 0.5, 0, 0.5]], // 12 (TL+TR): Right -> Left
    [[1, 0.5, 0.5, 1]], // 13 (Not BR): Right -> Bottom
    [[0.5, 1, 0, 0.5]], // 14 (Not BL): Bottom -> Left
    [] // 15: Full
];

export async function processTraceNode(
    params: any,
    resolution: number,
    input: SVGResult | null
): Promise<SVGResult> {
    if (!input) return { xml: '', defs: [] };

    const threshold = params.threshold ?? 0.5;
    const fidelity = params.fidelity ?? 128; // Grid size
    const invert = params.invert ?? false;

    // 1. Rasterize Input to a small canvas for sampling
    let srcUrl = '';
    try {
        srcUrl = await svgToDataUrl(input.xml, input.defs, fidelity, fidelity, resolution);
    } catch (e) {
        console.error("Trace node failed to rasterize input", e);
        return input;
    }

    // 2. Perform Marching Squares & Stitching
    const pathData = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = fidelity;
            canvas.height = fidelity;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            if (!ctx) { resolve(''); return; }

            ctx.drawImage(img, 0, 0, fidelity, fidelity);
            const imageData = ctx.getImageData(0, 0, fidelity, fidelity);
            const data = imageData.data;

            // Helper to get binary state of a pixel
            const getState = (x: number, y: number) => {
                if (x < 0 || y < 0 || x >= fidelity || y >= fidelity) return 0;
                const i = (y * fidelity + x) * 4;
                // Use Luminance
                const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
                const val = invert ? (lum < threshold ? 1 : 0) : (lum > threshold ? 1 : 0);
                return val;
            };

            const scale = resolution / fidelity;
            
            // Map to store graph edges for stitching: StartPoint -> EndPoint
            // Key format: "x,y" (fixed precision)
            const nextMap = new Map<string, string>();
            
            const k = (x: number, y: number) => `${x.toFixed(2)},${y.toFixed(2)}`;

            // March cells
            for (let y = 0; y < fidelity - 1; y++) {
                for (let x = 0; x < fidelity - 1; x++) {
                    const tl = getState(x, y);
                    const tr = getState(x + 1, y);
                    const br = getState(x + 1, y + 1);
                    const bl = getState(x, y + 1);
                    
                    const caseIdx = (tl * 8) + (tr * 4) + (br * 2) + (bl * 1);

                    if (caseIdx === 0 || caseIdx === 15) continue;

                    const lines = CASES[caseIdx];
                    if (!lines) continue;

                    for (const line of lines) {
                        const p1x = (x + line[0]) * scale;
                        const p1y = (y + line[1]) * scale;
                        const p2x = (x + line[2]) * scale;
                        const p2y = (y + line[3]) * scale;

                        const startKey = k(p1x, p1y);
                        const endKey = k(p2x, p2y);
                        
                        nextMap.set(startKey, endKey);
                    }
                }
            }

            // Stitch segments into paths
            let d = "";
            const visited = new Set<string>();
            const maxSteps = fidelity * fidelity * 2; // Safety break

            for (const [startKey, endKey] of nextMap.entries()) {
                if (visited.has(startKey)) continue;

                // Start new subpath
                const [sx, sy] = startKey.split(',');
                d += `M ${sx} ${sy} `;
                visited.add(startKey);

                let curr = endKey;
                let steps = 0;

                while (curr && steps < maxSteps) {
                    const [cx, cy] = curr.split(',');
                    d += `L ${cx} ${cy} `;
                    
                    if (curr === startKey) {
                        d += "Z "; // Close loop
                        break;
                    }

                    if (visited.has(curr)) {
                        // Merged into existing or dead end
                        break;
                    }
                    visited.add(curr);

                    if (nextMap.has(curr)) {
                        curr = nextMap.get(curr)!;
                    } else {
                        break; // Open path
                    }
                    steps++;
                }
            }

            resolve(d);
        };
        img.onerror = () => resolve('');
        img.crossOrigin = "Anonymous";
        img.src = srcUrl;
    });

    if (!pathData) return { xml: '', defs: [] };

    return {
        // Output as Filled White shape
        xml: `<path d="${pathData}" fill="white" stroke="none" />`,
        defs: []
    };
}
