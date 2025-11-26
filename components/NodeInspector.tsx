
import React from 'react';
import { X, Download, MonitorUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { NodeType } from '../types';
import { SliderControl } from './ui/Controls';
import { generateTexturePNG, downloadImage } from '../services/graphCompiler';

const NodeInspector: React.FC = () => {
  const { editingNodeId, nodes, edges, projectName, setEditingNodeId, updateNodeParams, inspectorPosition } = useStore();
  
  const node = nodes.find(n => n.id === editingNodeId);

  if (!editingNodeId || !node || !inspectorPosition) return null;

  const { data } = node;

  const handleExport = async (resValue: string) => {
     const resInt = parseInt(resValue);
     // Use generateTexturePNG to ensure filters like Glow are rasterized correctly
     const url = await generateTexturePNG(nodes, edges, resInt);
     if (url) {
       downloadImage(url, `${projectName.replace(/\s+/g, '_')}_${resValue}.png`);
     }
  };
  
  const supportsPreview = data.type !== NodeType.OUTPUT && data.type !== NodeType.VALUE && data.type !== NodeType.COLOR;

  return (
    <>
      {/* Invisible backdrop to handle click-outside closing */}
      <div className="fixed inset-0 z-[60]" onClick={() => setEditingNodeId(null)} />

      <div 
        className="fixed z-[70] w-[280px] bg-[#1a1a1d] border border-white/10 rounded-xl shadow-2xl flex flex-col"
        style={{
          top: inspectorPosition.y,
          left: inspectorPosition.x,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div className="h-10 border-b border-white/10 flex items-center justify-between px-3 bg-white/[0.02]">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
             <span className="font-semibold text-gray-200 text-xs">{data.label}</span>
          </div>
          <button 
            onClick={() => setEditingNodeId(null)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto max-h-[400px]">
          
          {/* Common Settings */}
          {supportsPreview && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <label className="text-[10px] text-gray-500 font-medium">Show Preview</label>
                <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                    <input 
                        type="checkbox" 
                        name="toggle" 
                        id="toggle" 
                        className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        checked={data.params.showPreview === true}
                        onChange={(e) => updateNodeParams(node.id, { showPreview: e.target.checked })}
                        style={{ right: data.params.showPreview === true ? '0' : 'auto', left: data.params.showPreview === true ? 'auto' : '0' }}
                    />
                    <label 
                        htmlFor="toggle" 
                        className={
                            `toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${data.params.showPreview === true ? 'bg-purple-600' : 'bg-gray-700'}`
                        }
                    ></label>
                </div>
            </div>
          )}

          {data.type === NodeType.COLOR && (
            <>
              <div className="w-full h-8 rounded border border-white/10 shadow-inner relative overflow-hidden mb-3">
                 <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)', backgroundSize: '10px 10px'}} />
                 <div className="absolute inset-0" style={{ backgroundColor: `rgba(${data.params.r ?? 255},${data.params.g ?? 255},${data.params.b ?? 255}, 1)` }} />
              </div>
              <SliderControl label="Red" value={data.params.r ?? 255} min={0} max={255} onChange={(v:number) => updateNodeParams(node.id, {r:v})} />
              <SliderControl label="Green" value={data.params.g ?? 255} min={0} max={255} onChange={(v:number) => updateNodeParams(node.id, {g:v})} />
              <SliderControl label="Blue" value={data.params.b ?? 255} min={0} max={255} onChange={(v:number) => updateNodeParams(node.id, {b:v})} />
            </>
          )}
          
          {data.type === NodeType.ALPHA && (
            <SliderControl label="Opacity" value={data.params.value ?? 1} min={0} max={1} onChange={(v:number) => updateNodeParams(node.id, {value:v})} />
          )}

          {data.type === NodeType.VALUE && (
            <SliderControl label="Value" value={data.params.value ?? 0.5} min={0} max={1} onChange={(v:number) => updateNodeParams(node.id, {value:v})} />
          )}

          {data.type === NodeType.WAVY_RING && (
            <>
               <SliderControl label="Radius" value={data.params.radius ?? 100} min={10} max={200} step={1} onChange={(v:number) => updateNodeParams(node.id, {radius:v})} />
               <SliderControl label="Frequency" value={data.params.frequency ?? 20} min={3} max={50} step={1} onChange={(v:number) => updateNodeParams(node.id, {frequency:Math.round(v)})} />
               <SliderControl label="Amplitude" value={data.params.amplitude ?? 10} min={0} max={40} step={1} onChange={(v:number) => updateNodeParams(node.id, {amplitude:v})} />
            </>
          )}

          {data.type === NodeType.BEAM && (
            <>
               <SliderControl label="Length" value={data.params.length ?? 250} min={50} max={400} step={1} onChange={(v:number) => updateNodeParams(node.id, {length:v})} />
               <SliderControl label="Top Width" value={data.params.topWidth ?? 5} min={0} max={100} step={1} onChange={(v:number) => updateNodeParams(node.id, {topWidth:v})} />
               <SliderControl label="Bottom Width" value={data.params.bottomWidth ?? 100} min={1} max={200} step={1} onChange={(v:number) => updateNodeParams(node.id, {bottomWidth:v})} />
            </>
          )}

          {data.type === NodeType.FILL && (
            <>
               <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] text-gray-500 font-medium">Fill Enabled</label>
                 <input 
                   type="checkbox" 
                   className="accent-purple-500 cursor-pointer"
                   checked={data.params.fillEnabled ?? true} 
                   onChange={(e) => updateNodeParams(node.id, {fillEnabled: e.target.checked})} 
                 />
               </div>
               <SliderControl label="Stroke Width" value={data.params.strokeWidth ?? 0} min={0} max={20} step={0.5} onChange={(v:number) => updateNodeParams(node.id, {strokeWidth:v})} />
            </>
          )}

          {data.type === NodeType.GLOW && (
            <>
              <SliderControl label="Radius" value={data.params.radius ?? 20} min={1} max={100} step={1} onChange={(v:number) => updateNodeParams(node.id, {radius:v})} />
              <SliderControl label="Intensity" value={data.params.intensity ?? 1.5} min={0} max={5} onChange={(v:number) => updateNodeParams(node.id, {intensity:v})} />
            </>
          )}
          
          {data.type === NodeType.NEON && (
            <>
              <SliderControl label="Radius" value={data.params.radius ?? 15} min={1} max={100} step={1} onChange={(v:number) => updateNodeParams(node.id, {radius:v})} />
            </>
          )}
          
          {data.type === NodeType.SOFT_BLUR && (
             <SliderControl label="Radius" value={data.params.radius ?? 5} min={0} max={50} step={1} onChange={(v:number) => updateNodeParams(node.id, {radius:v})} />
          )}

          {data.type === NodeType.STROKE && (
            <>
              <SliderControl label="Width" value={data.params.width ?? 1} min={0} max={20} step={0.5} onChange={(v:number) => updateNodeParams(node.id, {width:v})} />
              <SliderControl label="Opacity" value={data.params.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v:number) => updateNodeParams(node.id, {opacity:v})} />
            </>
          )}

          {data.type === NodeType.GRADIENT_FADE && (
            <>
              <SliderControl label="Angle" value={data.params.direction ?? 90} min={0} max={360} step={1} onChange={(v:number) => updateNodeParams(node.id, {direction:v})} />
              <SliderControl label="Start Opacity" value={data.params.start ?? 1} min={0} max={1} onChange={(v:number) => updateNodeParams(node.id, {start:v})} />
              <SliderControl label="End Opacity" value={data.params.end ?? 0} min={0} max={1} onChange={(v:number) => updateNodeParams(node.id, {end:v})} />
            </>
          )}

          {data.type === NodeType.TRANSLATE && (
            <>
              <SliderControl label="X Offset" value={data.params.x ?? 0} min={-1} max={1} onChange={(v:number) => updateNodeParams(node.id, {x:v})} />
              <SliderControl label="Y Offset" value={data.params.y ?? 0} min={-1} max={1} onChange={(v:number) => updateNodeParams(node.id, {y:v})} />
            </>
          )}

          {data.type === NodeType.ROTATE && (
             <SliderControl label="Angle" value={data.params.angle ?? 0} min={0} max={360} step={1} onChange={(v:number) => updateNodeParams(node.id, {angle:v})} />
          )}

          {data.type === NodeType.SCALE && (
             <SliderControl label="Factor" value={data.params.scale ?? 1} min={0.1} max={5} onChange={(v:number) => updateNodeParams(node.id, {scale:v})} />
          )}

          {data.type === NodeType.POLAR && (
            <>
              <div className="flex flex-col gap-1.5 mb-2">
                 <label className="text-[10px] text-gray-500 font-medium px-1">Mapping Mode</label>
                 <div className="relative group/select">
                     <select 
                       className="w-full bg-[#09090b] border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer appearance-none transition-colors"
                       value={data.params.type || 'rect_to_polar'}
                       onChange={(e) => updateNodeParams(node.id, { type: e.target.value })}
                     >
                       <option value="rect_to_polar" className="bg-[#09090b] text-gray-300">Rect to Polar (Burst)</option>
                       <option value="polar_to_rect" className="bg-[#09090b] text-gray-300">Polar to Rect (Ring)</option>
                     </select>
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover/select:text-gray-300 transition-colors">
                        <ChevronDown size={12} />
                     </div>
                 </div>
              </div>

              <SliderControl label="X Offset" value={data.params.x ?? 0} min={-1} max={1} step={0.01} onChange={(v:number) => updateNodeParams(node.id, {x:v})} />
              <SliderControl label="Y Offset" value={data.params.y ?? 0} min={-1} max={1} step={0.01} onChange={(v:number) => updateNodeParams(node.id, {y:v})} />
              <SliderControl label="Radial Scale" value={data.params.radialScale ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateNodeParams(node.id, {radialScale:v})} />
              <SliderControl label="Angular Scale" value={data.params.angularScale ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateNodeParams(node.id, {angularScale:v})} />
            </>
          )}
          
          {data.type === NodeType.OUTPUT && (
             <div className="flex flex-col gap-3">
                <div className="text-xs text-gray-400 font-medium mb-1">Export Settings</div>
                
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] text-gray-500">Resolution</label>
                    <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-md px-2 py-1.5">
                       <MonitorUp size={14} className="text-gray-500" />
                       <select 
                         className="bg-transparent text-xs text-gray-300 w-full focus:outline-none cursor-pointer"
                         value={data.params.resolution || "512"}
                         onChange={(e) => updateNodeParams(node.id, { resolution: e.target.value })}
                       >
                         <option value="512">512 x 512</option>
                         <option value="1024">1024 x 1024</option>
                         <option value="2048">2048 x 2048</option>
                         <option value="4096">4096 x 4096</option>
                       </select>
                    </div>
                </div>

                <button 
                   onClick={() => handleExport(data.params.resolution || "512")}
                   className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                >
                   <Download size={14} />
                   Export Texture
                </button>
             </div>
          )}

        </div>
      </div>
    </>
  );
};

export default NodeInspector;