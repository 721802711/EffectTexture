
import { SVGResult, svgToDataUrl } from './svgUtils';

// Simple seeded PRNG
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export async function processWaveNode(
    params: any, 
    resolution: number,
    input: SVGResult | null
): Promise<SVGResult> {
    const waveType = params.waveType || 'sine'; // 'sine' | 'square'
    const generators = params.generators ?? 5; // 1 - 20
    const freq = params.frequency ?? 50; // 1 - 200
    const amp = (params.amplitude ?? 60) / 100; // 0 - 1
    const threshold = (params.threshold ?? 50) / 100; // 0 - 1
    const soft = (params.softness ?? 5) / 100; // 0 - 0.5
    const seedVal = params.seed ?? 12345;

    // Generate Seeds deterministically based on param seed
    const rand = mulberry32(seedVal);
    const seeds = [];
    for(let i=0; i<generators; i++) {
        seeds.push({
            phase: rand() * Math.PI * 2,
            speed: 0.5 + rand() * 1.5
        });
    }

    // Rasterize Input if exists (to use as gradient source)
    let srcCtx: CanvasRenderingContext2D | null = null;
    if (input) {
         try {
            const url = await svgToDataUrl(input.xml, input.defs, resolution, resolution, resolution);
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.crossOrigin = "Anonymous";
                img.src = url;
            });
            const c = document.createElement('canvas');
            c.width = resolution; c.height = resolution;
            srcCtx = c.getContext('2d', { willReadFrequently: true });
            srcCtx?.drawImage(img, 0, 0);
         } catch(e) {
             console.error("Wave node input rasterization failed", e);
         }
    }

    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    if(!ctx) return { xml: '', defs: [] };

    const dstData = ctx.createImageData(resolution, resolution);
    const data = dstData.data;
    const srcData = srcCtx ? srcCtx.getImageData(0,0, resolution, resolution).data : null;

    // 1. Generate Wave Noise Data (X-Axis)
    // We precalculate the column offsets to save performance in the nested loop
    const colNoise = new Float32Array(resolution);
    
    for (let x = 0; x < resolution; x++) {
        let totalVal = 0;
        const normX = x / resolution; 

        seeds.forEach(seed => {
            const k = (normX * freq * Math.PI * 2 * seed.speed) + seed.phase;
            let val = 0;
            if (waveType === 'square') {
                val = Math.sign(Math.sin(k)); 
            } else {
                val = Math.sin(k);
            }
            totalVal += val;
        });

        // Normalize
        colNoise[x] = totalVal / Math.max(1, seeds.length * 0.6);
    }

    // 2. Fill Pixels (Y-Axis Mixing)
    for (let y = 0; y < resolution; y++) {
        // Default Gradient (Vertical 1 -> 0)
        const defaultGrad = 1 - (y / resolution);

        for (let x = 0; x < resolution; x++) {
            
            // Determine Base Value (Input Image Luminance OR Default Gradient)
            let baseVal = defaultGrad;
            
            if (srcData) {
                const idx = (y * resolution + x) * 4;
                // Luminance calculation
                const lum = (srcData[idx] * 0.299 + srcData[idx+1] * 0.587 + srcData[idx+2] * 0.114) / 255;
                // Multiply by alpha for masking support
                baseVal = lum * (srcData[idx+3] / 255);
            }

            const noiseVal = colNoise[x] * amp; 
            const mix = baseVal + noiseVal;
            
            // Soft Threshold
            let alphaVal = 0;
            
            if (soft <= 0.001) {
                alphaVal = mix > threshold ? 255 : 0;
            } else {
                const lower = threshold - soft;
                const upper = threshold + soft;
                let t = (mix - lower) / (upper - lower);
                t = Math.max(0, Math.min(1, t)); 
                alphaVal = t * 255;
            }
            
            const idx = (y * resolution + x) * 4;
            // White color with variable alpha
            data[idx] = 255;     // R
            data[idx+1] = 255;   // G
            data[idx+2] = 255;   // B
            data[idx+3] = alphaVal; // Alpha
        }
    }

    ctx.putImageData(dstData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    if (!dataUrl) return { xml: '', defs: [] };

    return {
        xml: `<image href="${dataUrl}" x="0" y="0" width="${resolution}" height="${resolution}" preserveAspectRatio="none" />`,
        defs: []
    };
}
