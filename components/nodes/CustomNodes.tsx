
import React, { memo, useEffect, useState, useRef } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../../store';
import { NodeType } from '../../types';
import { SliderControl } from '../ui/Controls';
import { generateTexturePNG } from '../../services/graphCompiler';
import { Upload, Image as ImageIcon, Plus, Trash2, ChevronDown } from 'lucide-react';

// Helper Component for Node Previews
const NodePreview = ({ nodeId, visible }: { nodeId: string, visible?: boolean }) => {
  const { nodes, edges } = useStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
      if (!visible) {
          setPreviewUrl(null);
          return;
      }

      let active = true;
      const generate = async () => {
          // Generate thumbnail (512px) for preview
          try {
             // Pass nodeId to generateTexturePNG to render the graph up to this node
             const url = await generateTexturePNG(nodes, edges, 512, nodeId);
             if (active) setPreviewUrl(url);
          } catch(e) { 
             console.error("Preview generation failed", e); 
          }
      }
      
      // Debounce to prevent heavy rendering during drag
      const timeout = setTimeout(generate, 300); 
      return () => { active = false; clearTimeout(timeout); }
  }, [nodes, edges, nodeId, visible]);

  if (!visible) return null;

  return (
      <div className="w-32 h-32 bg-black/50 rounded mt-3 overflow-hidden border border-white/5 relative group/preview mx-auto">
          {previewUrl ? (
             <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          ) : (
             <div className="w-full h-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
             </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1 opacity-0 group-hover/preview:opacity-100 transition-opacity text-[9px] text-center text-gray-400">
             512px
          </div>
      </div>
  );
}

// ============================================================================
// 1. GENERATOR NODES (Output Blue/SVG)
// ============================================================================

const RectangleNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['out']} 
      headerColor="bg-orange-500/80"
      showPreview={data.params.showPreview}
    >
      <SliderControl label="Width" value={data.params.width ?? 300} min={1} max={512} step={1} onChange={(v:number) => updateParams(id, {width:v})} />
      <SliderControl label="Height" value={data.params.height ?? 300} min={1} max={512} step={1} onChange={(v:number) => updateParams(id, {height:v})} />
      
      <div className="grid grid-cols-2 gap-x-2">
         <SliderControl label="Radius TL" value={data.params.rTL ?? 0} min={0} max={150} step={1} onChange={(v:number) => updateParams(id, {rTL:v})} />
         <SliderControl label="Radius TR" value={data.params.rTR ?? 0} min={0} max={150} step={1} onChange={(v:number) => updateParams(id, {rTR:v})} />
         <SliderControl label="Radius BL" value={data.params.rBL ?? 0} min={0} max={150} step={1} onChange={(v:number) => updateParams(id, {rBL:v})} />
         <SliderControl label="Radius BR" value={data.params.rBR ?? 0} min={0} max={150} step={1} onChange={(v:number) => updateParams(id, {rBR:v})} />
      </div>
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const CircleNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['out']} 
      headerColor="bg-orange-500/80"
      showPreview={data.params.showPreview}
    >
      <SliderControl label="Width" value={data.params.width ?? 300} min={1} max={512} step={1} onChange={(v:number) => updateParams(id, {width:v})} />
      <SliderControl label="Height" value={data.params.height ?? 300} min={1} max={512} step={1} onChange={(v:number) => updateParams(id, {height:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const PolygonNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['out']} 
      headerColor="bg-orange-500/80"
      showPreview={data.params.showPreview}
    >
       <SliderControl label="Points" value={data.params.points ?? 5} min={3} max={20} step={1} onChange={(v:number) => updateParams(id, {points:Math.round(v)})} />
       <SliderControl label="Inner Radius" value={data.params.innerRadius ?? 50} min={1} max={250} step={1} onChange={(v:number) => updateParams(id, {innerRadius:v})} />
       <SliderControl label="Outer Radius" value={data.params.outerRadius ?? 100} min={1} max={250} step={1} onChange={(v:number) => updateParams(id, {outerRadius:v})} />
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const WavyRingNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['out']} 
      headerColor="bg-orange-500/80"
      showPreview={data.params.showPreview}
    >
       <SliderControl label="Radius" value={data.params.radius ?? 100} min={10} max={200} step={1} onChange={(v:number) => updateParams(id, {radius:v})} />
       <SliderControl label="Frequency" value={data.params.frequency ?? 20} min={3} max={50} step={1} onChange={(v:number) => updateParams(id, {frequency:Math.round(v)})} />
       <SliderControl label="Amplitude" value={data.params.amplitude ?? 10} min={0} max={40} step={1} onChange={(v:number) => updateParams(id, {amplitude:v})} />
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const BeamNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['out']} 
      headerColor="bg-orange-500/80"
      showPreview={data.params.showPreview}
    >
       <SliderControl label="Length" value={data.params.length ?? 250} min={50} max={400} step={1} onChange={(v:number) => updateParams(id, {length:v})} />
       <SliderControl label="Top Width" value={data.params.topWidth ?? 5} min={0} max={100} step={1} onChange={(v:number) => updateParams(id, {topWidth:v})} />
       <SliderControl label="Bottom Width" value={data.params.bottomWidth ?? 100} min={1} max={200} step={1} onChange={(v:number) => updateParams(id, {bottomWidth:v})} />
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

interface Stop {
  id: string;
  offset: number; // 0-1
  color: string;
  opacity: number; // 0-1
}

const GradientNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  
  const stops: Stop[] = data.params.stops || [
    { id: '1', offset: 0, color: '#000000', opacity: 1 },
    { id: '2', offset: 1, color: '#ffffff', opacity: 1 }
  ];

  const handleAddStop = () => {
    const newStop: Stop = {
      id: Date.now().toString(),
      offset: 0.5,
      color: '#888888',
      opacity: 1
    };
    const newStops = [...stops, newStop].sort((a, b) => a.offset - b.offset);
    updateParams(id, { stops: newStops });
  };

  const handleUpdateStop = (stopId: string, updates: Partial<Stop>) => {
    const newStops = stops.map(s => s.id === stopId ? { ...s, ...updates } : s);
    if (updates.offset !== undefined) {
      newStops.sort((a, b) => a.offset - b.offset);
    }
    updateParams(id, { stops: newStops });
  };

  const handleRemoveStop = (stopId: string) => {
    if (stops.length <= 2) return; 
    const newStops = stops.filter(s => s.id !== stopId);
    updateParams(id, { stops: newStops });
  };

  const gradientCSS = `linear-gradient(90deg, ${stops.map(s => {
    return `${s.color} ${s.offset * 100}%`;
  }).join(', ')})`;

  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['out']} 
      headerColor="bg-orange-500/80"
      showPreview={data.params.showPreview}
      className="w-72" 
    >
       <div className="mb-4">
         <div className="w-full h-8 rounded border border-white/10 relative overflow-hidden bg-[url('https://transparent-textures.patterns.velmo.de/checkerboard.png')] bg-repeat">
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ background: gradientCSS }}
            />
         </div>
       </div>

       <div className="mb-4 space-y-2 pb-4 border-b border-white/5">
          <SliderControl label="X Direction" value={data.params.x ?? 1} min={-1} max={1} step={0.1} onChange={(v:number) => updateParams(id, {x:v})} />
          <SliderControl label="Y Direction" value={data.params.y ?? 0} min={-1} max={1} step={0.1} onChange={(v:number) => updateParams(id, {y:v})} />
          <SliderControl label="Power" value={data.params.power ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateParams(id, {power:v})} />
       </div>

       <div className="flex items-center justify-between mb-2">
         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stops</span>
         <button 
           onClick={handleAddStop}
           className="p-1 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 transition-colors"
           title="Add Stop"
         >
           <Plus size={12} />
         </button>
       </div>

       <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
         {stops.map((stop) => (
           <div key={stop.id} className="flex items-center gap-2 bg-black/20 p-1.5 rounded border border-white/5 group/row">
              <div className="flex flex-col w-12 shrink-0">
                 <input 
                   type="number" 
                   min={0} max={100}
                   value={Math.round(stop.offset * 100)}
                   onChange={(e) => {
                     const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                     handleUpdateStop(stop.id, { offset: val / 100 });
                   }}
                   className="bg-transparent text-[10px] font-mono text-gray-300 text-center border-b border-white/10 focus:border-purple-500 focus:outline-none"
                 />
                 <span className="text-[8px] text-gray-600 text-center">%</span>
              </div>

              <div className="flex-1 flex items-center gap-2 bg-black/20 rounded p-1 border border-white/5 relative">
                  <div className="w-5 h-5 rounded-sm overflow-hidden relative border border-white/10 shrink-0">
                     <input 
                        type="color" 
                        value={stop.color}
                        onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                        className="absolute -top-1 -left-1 w-[150%] h-[150%] p-0 border-none cursor-pointer"
                     />
                  </div>
                  
                  <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

                  <div className="flex items-center gap-1 w-full">
                    <span className="text-[9px] text-gray-500">Op</span>
                    <input 
                       type="number" 
                       min={0} max={100}
                       value={Math.round(stop.opacity * 100)}
                       onChange={(e) => {
                         const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                         handleUpdateStop(stop.id, { opacity: val / 100 });
                       }}
                       className="w-full bg-transparent text-[10px] text-gray-300 focus:outline-none"
                    />
                    <span className="text-[9px] text-gray-600">%</span>
                  </div>
              </div>

              <button 
                onClick={() => handleRemoveStop(stop.id)}
                disabled={stops.length <= 2}
                className={`p-1 text-gray-600 hover:text-red-400 transition-colors ${stops.length <= 2 ? 'opacity-20 cursor-not-allowed' : ''}`}
              >
                <Trash2 size={12} />
              </button>
           </div>
         ))}
       </div>

       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// ============================================================================
// 2. INPUT NODES
// ============================================================================

const ColorNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={['in']} 
      outputs={['rgba']} 
      headerColor="bg-emerald-500/80"
      showPreview={false} 
    >
      <div className="flex gap-2 mb-2">
        <div className="w-full h-8 rounded border border-white/10 shadow-inner relative overflow-hidden">
           <div className="absolute inset-0 checkerboard-bg opacity-20" />
           <div 
              className="absolute inset-0"
              style={{ backgroundColor: `rgba(${data.params.r ?? 255},${data.params.g ?? 255},${data.params.b ?? 255}, 1)` }}
           />
        </div>
      </div>
      <SliderControl label="Red" value={data.params.r ?? 255} min={0} max={255} step={1} onChange={(v:number) => updateParams(id, {r:v})} />
      <SliderControl label="Green" value={data.params.g ?? 255} min={0} max={255} step={1} onChange={(v:number) => updateParams(id, {g:v})} />
      <SliderControl label="Blue" value={data.params.b ?? 255} min={0} max={255} step={1} onChange={(v:number) => updateParams(id, {b:v})} />
    </BaseNode>
  );
};

const ValueNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={['val']} 
      headerColor="bg-emerald-500/80"
      showPreview={false}
    >
      <SliderControl 
        label="Luminance" 
        value={data.params.value ?? 0.5} 
        min={0} max={1} 
        onChange={(v:number) => updateParams(id, {value:v})} 
      />
    </BaseNode>
  );
};

const AlphaNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={['in']}
      outputs={['alpha']} 
      headerColor="bg-emerald-500/80"
      showPreview={data.params.showPreview}
    >
      <div className="flex gap-2 mb-2">
        <div className="w-full h-8 rounded border border-white/10 shadow-inner relative overflow-hidden">
           <div className="absolute inset-0 checkerboard-bg opacity-20" />
           <div 
              className="absolute inset-0 bg-white transition-opacity"
              style={{ opacity: data.params.value ?? 1 }}
           />
        </div>
      </div>
      <SliderControl 
        label="Opacity" 
        value={data.params.value ?? 1} 
        min={0} max={1} 
        onChange={(v:number) => updateParams(id, {value:v})} 
      />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// IMAGE NODE: Output Green (Bitmap)
const ImageNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateParams(id, { imageSrc: event.target?.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const hasImage = !!data.params.imageSrc;

  return (
    <BaseNode 
      id={id} 
      label={data.label} 
      selected={selected} 
      inputs={[]} 
      outputs={[{ id: 'rgba', type: 'bitmap' }]} 
      headerColor="bg-emerald-500/80"
      showPreview={false} 
    >
       <input 
         type="file" 
         ref={inputRef} 
         onChange={handleUpload} 
         accept="image/*" 
         className="hidden" 
       />
       
       <div className="w-full aspect-square bg-black/50 rounded border border-white/10 relative overflow-hidden group/image">
          {hasImage ? (
            <>
              <img src={data.params.imageSrc} alt="Uploaded" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:image:opacity-100 transition-opacity">
                <button 
                  onClick={() => inputRef.current?.click()}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs text-white backdrop-blur-sm"
                >
                  Change
                </button>
              </div>
            </>
          ) : (
             <div 
               className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2 cursor-pointer hover:bg-white/5 transition-colors"
               onClick={() => inputRef.current?.click()}
             >
                <ImageIcon size={24} />
                <span className="text-xs">Click to Upload</span>
             </div>
          )}
       </div>
    </BaseNode>
  );
};

// ============================================================================
// 3. MATH NODES (CSG)
// ============================================================================

const MathAddNode = ({ id, data, selected }: any) => (
  <BaseNode id={id} label="Add (Union)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}>
     <div className="flex flex-col gap-4 py-1">
       <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
         <span>Input A</span>
         <span>Input B</span>
       </div>
       <div className="text-[10px] text-gray-600 text-center italic">A + B (Union)</div>
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
     </div>
  </BaseNode>
);

const MathSubNode = ({ id, data, selected }: any) => (
  <BaseNode id={id} label="Subtract (Difference)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}>
     <div className="flex flex-col gap-4 py-1">
       <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
         <span>Input A</span>
         <span>Input B</span>
       </div>
       <div className="text-[10px] text-gray-600 text-center italic">A - B (Difference)</div>
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
     </div>
  </BaseNode>
);

const MathMultiplyNode = ({ id, data, selected }: any) => (
  <BaseNode id={id} label="Multiply (Intersection)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}>
     <div className="flex flex-col gap-4 py-1">
       <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
         <span>Input A</span>
         <span>Input B</span>
       </div>
       <div className="text-[10px] text-gray-600 text-center italic">A &times; B (Intersection)</div>
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
     </div>
  </BaseNode>
);

const MathDivideNode = ({ id, data, selected }: any) => (
  <BaseNode id={id} label="Divide (Exclusion)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}>
     <div className="flex flex-col gap-4 py-1">
       <div className="flex justify-between items-center text-[10px] text-gray-500 px-1">
         <span>Input A</span>
         <span>Input B</span>
       </div>
       <div className="text-[10px] text-gray-600 text-center italic">A &#8853; B (Exclusion)</div>
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
     </div>
  </BaseNode>
);

// ============================================================================
// 4. FILTER NODES
// ============================================================================

const FillNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Fill" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}>
      <div className="flex items-center justify-between mb-2 px-1">
         <label className="text-[10px] text-gray-500 font-medium">Fill Enabled</label>
         <input 
           type="checkbox" 
           className="accent-purple-500 cursor-pointer"
           checked={data.params.fillEnabled ?? true} 
           onChange={(e) => updateParams(id, {fillEnabled: e.target.checked})} 
         />
      </div>
      <SliderControl label="Stroke Width" value={data.params.strokeWidth ?? 0} min={0} max={20} step={0.5} onChange={(v:number) => updateParams(id, {strokeWidth:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const GlowNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Hard Glow" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Radius" value={data.params.radius ?? 20} min={1} max={100} step={1} onChange={(v:number) => updateParams(id, {radius:v})} />
      <SliderControl label="Intensity" value={data.params.intensity ?? 1.5} min={0} max={5} onChange={(v:number) => updateParams(id, {intensity:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const NeonNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Neon" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Radius" value={data.params.radius ?? 15} min={1} max={100} step={1} onChange={(v:number) => updateParams(id, {radius:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const SoftBlurNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Soft Blur" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Radius" value={data.params.radius ?? 5} min={0} max={50} step={1} onChange={(v:number) => updateParams(id, {radius:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const StrokeNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Stroke" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Width" value={data.params.width ?? 1} min={0} max={20} step={0.5} onChange={(v:number) => updateParams(id, {width:v})} />
      <SliderControl label="Opacity" value={data.params.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v:number) => updateParams(id, {opacity:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const GradientFadeNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Gradient Fade" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Angle" value={data.params.direction ?? 90} min={0} max={360} step={1} onChange={(v:number) => updateParams(id, {direction:v})} />
      <SliderControl label="Start Opacity" value={data.params.start ?? 1} min={0} max={1} onChange={(v:number) => updateParams(id, {start:v})} />
      <SliderControl label="End Opacity" value={data.params.end ?? 0} min={0} max={1} onChange={(v:number) => updateParams(id, {end:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// PIXELATE NODE: Input Blue (SVG), Output Green (Bitmap)
const PixelateNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label="Pixelate / Rasterize" 
      selected={selected} 
      inputs={['in']} 
      outputs={[{ id: 'out', type: 'bitmap' }]} 
      headerColor="bg-blue-500/80" 
      showPreview={data.params.showPreview}
    >
      <SliderControl 
        label="Pixel Size" 
        value={data.params.pixelSize ?? 1} 
        min={1} max={100} step={1} 
        onChange={(v:number) => updateParams(id, {pixelSize:v})} 
      />
      <div className="text-[10px] text-gray-500 px-1 mt-1 text-center italic">
         Size 1 = High Res Bake
      </div>
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// ============================================================================
// 5. TRANSFORM NODES
// ============================================================================

const TranslateNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Translate" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="X Offset" value={data.params.x ?? 0} min={-1} max={1} onChange={(v:number) => updateParams(id, {x:v})} />
      <SliderControl label="Y Offset" value={data.params.y ?? 0} min={-1} max={1} onChange={(v:number) => updateParams(id, {y:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const RotateNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Rotate" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Angle" value={data.params.angle ?? 0} min={0} max={360} step={1} onChange={(v:number) => updateParams(id, {angle:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const ScaleNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label="Scale" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Factor" value={data.params.scale ?? 1} min={0.1} max={5} onChange={(v:number) => updateParams(id, {scale:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// POLAR NODE: Input Blue (Vector), Output Green (Bitmap)
const PolarNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode 
      id={id} 
      label="Polar Coords" 
      selected={selected} 
      inputs={['in']} 
      outputs={[{ id: 'out', type: 'bitmap' }]} 
      headerColor="bg-violet-500/80" 
      showPreview={data.params.showPreview}
    >
      
      <div className="flex flex-col gap-1.5 mb-2">
         <label className="text-[10px] text-gray-500 font-medium px-1">Mapping Mode</label>
         <div className="relative group/select">
            <select 
              className="w-full bg-[#09090b] border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer appearance-none transition-colors"
              value={data.params.type || 'rect_to_polar'}
              onChange={(e) => updateParams(id, { type: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()} 
            >
              <option value="rect_to_polar" className="bg-[#09090b] text-gray-300">Rect to Polar (Burst)</option>
              <option value="polar_to_rect" className="bg-[#09090b] text-gray-300">Polar to Rect (Ring)</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover/select:text-gray-300 transition-colors">
               <ChevronDown size={12} />
            </div>
         </div>
      </div>

      <SliderControl label="X Offset" value={data.params.x ?? 0} min={-1} max={1} step={0.01} onChange={(v:number) => updateParams(id, {x:v})} />
      <SliderControl label="Y Offset" value={data.params.y ?? 0} min={-1} max={1} step={0.01} onChange={(v:number) => updateParams(id, {y:v})} />
      <SliderControl label="Radial Scale" value={data.params.radialScale ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateParams(id, {radialScale:v})} />
      <SliderControl label="Angular Scale" value={data.params.angularScale ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateParams(id, {angularScale:v})} />

      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// ============================================================================
// 6. OUTPUT NODE
// ============================================================================

const OutputNode = ({ id, data, selected }: any) => {
  const textureUrl = useStore((state) => state.previewTextureUrl);
  
  return (
    <BaseNode 
      id={id} 
      label="OUTPUT" 
      selected={selected} 
      inputs={[{ id: 'in', type: 'any' }]} 
      headerColor="bg-white" 
      className="w-64" 
      showPreview={false}
    >
      <div className="flex flex-col gap-2">
         {/* Preview Area */}
         <div className="w-full aspect-square bg-black/50 rounded overflow-hidden border border-white/10 relative">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            />
            {textureUrl ? (
               <img src={textureUrl} alt="Output" className="w-full h-full object-contain relative z-10" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                  Waiting for render...
               </div>
            )}
         </div>

         <div className="text-[10px] text-gray-500 text-center">
            {data.params.resolution || "512"}px Output
         </div>
      </div>
    </BaseNode>
  );
};

export const nodeTypes = {
  custom: RectangleNode, 
  [NodeType.RECTANGLE]: memo(RectangleNode),
  [NodeType.CIRCLE]: memo(CircleNode),
  [NodeType.POLYGON]: memo(PolygonNode),
  [NodeType.WAVY_RING]: memo(WavyRingNode),
  [NodeType.BEAM]: memo(BeamNode),
  [NodeType.GRADIENT]: memo(GradientNode), 
  
  [NodeType.COLOR]: memo(ColorNode),
  [NodeType.VALUE]: memo(ValueNode),
  [NodeType.ALPHA]: memo(AlphaNode),
  [NodeType.IMAGE]: memo(ImageNode), 
  [NodeType.ADD]: memo(MathAddNode),
  [NodeType.SUBTRACT]: memo(MathSubNode),
  [NodeType.MULTIPLY]: memo(MathMultiplyNode),
  [NodeType.DIVIDE]: memo(MathDivideNode),
  
  [NodeType.FILL]: memo(FillNode),
  [NodeType.GLOW]: memo(GlowNode),
  [NodeType.NEON]: memo(NeonNode),
  [NodeType.SOFT_BLUR]: memo(SoftBlurNode),
  [NodeType.STROKE]: memo(StrokeNode),
  [NodeType.GRADIENT_FADE]: memo(GradientFadeNode),
  [NodeType.PIXELATE]: memo(PixelateNode), 
  
  [NodeType.TRANSLATE]: memo(TranslateNode),
  [NodeType.ROTATE]: memo(RotateNode),
  [NodeType.SCALE]: memo(ScaleNode),
  [NodeType.POLAR]: memo(PolarNode),
  
  [NodeType.OUTPUT]: memo(OutputNode),
  outputNode: memo(OutputNode)
};