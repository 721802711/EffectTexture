
import React, { memo, useEffect, useState, useRef } from 'react';
import { BaseNode } from './BaseNode';
import { useStore } from '../../store';
import { NodeType } from '../../types';
import { SliderControl } from '../ui/Controls';
import { generateTexturePNG } from '../../services/graphCompiler';
import { getSplinePath, getBezierPath } from '../../utils/shapeUtils';
import { Upload, Image as ImageIcon, Plus, Trash2, ChevronDown, RefreshCw, Check } from 'lucide-react';

// --- Pen Tool Icons ---
const PenIcons = {
  Disconnected: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 6 12 Q 12 12 18 8" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill={active ? "white" : "#a1a1aa"} stroke="none" />
      <line x1="12" y1="12" x2="16" y2="10" strokeWidth="1.5" />
      <line x1="12" y1="12" x2="8" y2="14" strokeWidth="1.5" />
      <circle cx="16" cy="10" r="1.5" fill={active ? "white" : "#a1a1aa"} stroke="none" />
      <circle cx="8" cy="14" r="1.5" fill={active ? "white" : "#a1a1aa"} stroke="none" />
    </svg>
  ),
  Mirrored: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 6 12 Q 9 16 12 12 Q 15 8 18 12" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill={active ? "white" : "#a1a1aa"} stroke="none" />
      <line x1="12" y1="12" x2="6" y2="10" strokeWidth="1.5" />
      <line x1="12" y1="12" x2="18" y2="14" strokeWidth="1.5" />
      <circle cx="6" cy="10" r="1.5" fill={active ? "white" : "#a1a1aa"} stroke="none" />
      <circle cx="18" cy="14" r="1.5" fill={active ? "white" : "#a1a1aa"} stroke="none" />
    </svg>
  ),
  Aligned: ({ active }: { active: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 6 12 Q 9 14 12 12 Q 15 10 18 12" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill={active ? "white" : "#a1a1aa"} stroke="none" />
      <line x1="12" y1="12" x2="6" y2="10" strokeWidth="1.5" />
      <line x1="12" y1="12" x2="18" y2="14" strokeWidth="1.5" />
      <circle cx="6" cy="10" r="1.5" fill={active ? "white" : "#a1a1aa"} stroke="none" />
      <circle cx="18" cy="14" r="1.5" fill={active ? "white" : "#a1a1aa"} stroke="none" />
    </svg>
  ),
  Pen: ({ active }: { active: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Edit: ({ active }: { active: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#a1a1aa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

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
    <BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview}>
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
    <BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview}>
      <SliderControl label="Width" value={data.params.width ?? 300} min={1} max={512} step={1} onChange={(v:number) => updateParams(id, {width:v})} />
      <SliderControl label="Height" value={data.params.height ?? 300} min={1} max={512} step={1} onChange={(v:number) => updateParams(id, {height:v})} />
      <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

const PolygonNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  return (
    <BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview}>
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
    <BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview}>
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
    <BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview}>
       <SliderControl label="Length" value={data.params.length ?? 250} min={50} max={400} step={1} onChange={(v:number) => updateParams(id, {length:v})} />
       <SliderControl label="Top Width" value={data.params.topWidth ?? 5} min={0} max={100} step={1} onChange={(v:number) => updateParams(id, {topWidth:v})} />
       <SliderControl label="Bottom Width" value={data.params.bottomWidth ?? 100} min={1} max={200} step={1} onChange={(v:number) => updateParams(id, {bottomWidth:v})} />
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// --- LEGACY CUSTOM PATH NODE (SPLINE) ---

interface Point { 
    x: number; 
    y: number;
    type?: 'inner' | 'outer';
}

const PathNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  const { nodes, edges } = useStore();
  
  const points: Point[] = (Array.isArray(data.params.points) ? data.params.points : [
     { x: 0.5, y: 0.2, type: 'outer' },
     { x: 0.8, y: 0.8, type: 'inner' },
     { x: 0.2, y: 0.8, type: 'inner' }
  ]).filter((p: any) => p && typeof p.x === 'number' && typeof p.y === 'number');
  
  const editScope = data.params.importMode || 'all'; 
  const tension = data.params.tension ?? 0;
  const tensionInner = data.params.tensionInner ?? tension;
  const tensionOuter = data.params.tensionOuter ?? tension;
  const activeTension = editScope === 'inner' ? tensionInner : (editScope === 'outer' ? tensionOuter : tension);

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const incomingEdge = edges.find(e => e.target === id && e.targetHandle === 'in');
  const hasInput = !!incomingEdge;

  const handleTensionChange = (val: number) => {
      const updates: any = {};
      if (editScope === 'all') {
          updates.tension = val;
          updates.tensionInner = val;
          updates.tensionOuter = val;
      } else if (editScope === 'inner') {
          updates.tensionInner = val;
      } else if (editScope === 'outer') {
          updates.tensionOuter = val;
      }
      updateParams(id, updates);
  };

  const handleImport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!incomingEdge) return;
    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode) return;
    let newPoints: Point[] = [];
    if (sourceNode.data.type === NodeType.POLYGON) {
        newPoints = [{x:0.5, y:0.2}, {x:0.8,y:0.8}, {x:0.2,y:0.8}];
    }
    if (newPoints.length > 0) updateParams(id, { points: newPoints });
  };

  const handlePointDown = (e: React.PointerEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!points[idx]) return;
    if (svgRef.current) {
        svgRef.current.setPointerCapture(e.pointerId);
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / rect.width;
        const mouseY = (e.clientY - rect.top) / rect.height;
        dragOffsetRef.current = { x: mouseX - points[idx].x, y: mouseY - points[idx].y };
    }
    setDragIdx(idx);
    hasMovedRef.current = false;
  };

  const handleSvgPointerMove = (e: React.PointerEvent) => {
     if (dragIdx === null || !svgRef.current) return;
     if (!points[dragIdx]) return;
     e.preventDefault();
     e.stopPropagation();
     const rect = svgRef.current.getBoundingClientRect();
     const rawX = (e.clientX - rect.left) / rect.width;
     const rawY = (e.clientY - rect.top) / rect.height;
     let x = Math.min(1, Math.max(0, rawX - dragOffsetRef.current.x));
     let y = Math.min(1, Math.max(0, rawY - dragOffsetRef.current.y));
     const currentP = points[dragIdx];
     if (currentP.x !== x || currentP.y !== y) {
         hasMovedRef.current = true;
         const newPoints = [...points];
         newPoints[dragIdx] = { ...newPoints[dragIdx], x, y };
         updateParams(id, { points: newPoints });
     }
  };

  const handleSvgPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (svgRef.current) svgRef.current.releasePointerCapture(e.pointerId);
    if (dragIdx !== null && !hasMovedRef.current && points[dragIdx]) {
        const newPoints = [...points];
        const currentType = newPoints[dragIdx].type || 'outer';
        newPoints[dragIdx] = { ...newPoints[dragIdx], type: currentType === 'outer' ? 'inner' : 'outer' };
        updateParams(id, { points: newPoints });
    }
    setDragIdx(null);
    hasMovedRef.current = false;
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const newPoints = [...points, { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, type: 'outer' as const }];
      updateParams(id, { points: newPoints });
  }

  const handlePointDoubleClick = (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      if (points.length > 3) {
          const newPoints = points.filter((_, i) => i !== idx);
          updateParams(id, { points: newPoints });
      }
  }

  const W = 180; const H = 180;
  const renderPoints = points.map(p => ({ x: p.x * W, y: p.y * H, type: p.type }));
  const pathData = getSplinePath(renderPoints, { inner: tensionInner, outer: tensionOuter }, true);

  return (
    <BaseNode id={id} label={data.label} selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview} className="w-60">
       <div className="flex flex-col gap-2">
         <div className="w-full aspect-square bg-black/40 rounded border border-white/10 relative overflow-hidden group/editor select-none">
            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} className="cursor-crosshair touch-none" onDoubleClick={handleDoubleClick} onPointerMove={handleSvgPointerMove} onPointerUp={handleSvgPointerUp} onPointerDown={(e) => e.stopPropagation()}>
               <path d={`M 0 ${H/2} L ${W} ${H/2} M ${W/2} 0 L ${W/2} ${H}`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
               <path d={pathData} fill="rgba(255,255,255,0.1)" stroke="#a855f7" strokeWidth="2" className="pointer-events-none" />
               {renderPoints.map((p, i) => (
                   <circle key={i} cx={p.x} cy={p.y} r={7} fill={dragIdx === i ? "#fff" : (p.type === 'inner' ? '#f59e0b' : '#a855f7')} stroke="black" strokeWidth="2" className="cursor-grab nodrag" onPointerDown={(e) => handlePointDown(e, i)} onDoubleClick={(e) => handlePointDoubleClick(e, i)} />
               ))}
            </svg>
         </div>
         {hasInput && <button onClick={handleImport} className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-medium flex items-center justify-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}><RefreshCw size={12} /> Import Shape</button>}
         <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between items-center px-1"><label className="text-[10px] text-gray-500 font-medium">Edit Scope (Target)</label></div>
            <div className="relative group/select">
                <select className="w-full bg-[#09090b] border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none cursor-pointer appearance-none" value={editScope} onChange={(e) => updateParams(id, { importMode: e.target.value })} onPointerDown={(e) => e.stopPropagation()} >
                    <option value="all">All (Global)</option>
                    <option value="inner">Inner Only</option>
                    <option value="outer">Outer Only</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronDown size={12} /></div>
            </div>
         </div>
         <SliderControl label="Roundness" value={activeTension} min={0} max={1} step={0.01} onChange={handleTensionChange} />
       </div>
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};

// --- PEN TOOL NODE (BEZIER) ---

interface BezierPoint { 
    x: number; 
    y: number;
    handleIn: { x: number, y: number };
    handleOut: { x: number, y: number };
}

const PenToolNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  const { nodes, edges } = useStore();
  
  const [toolMode, setToolMode] = useState<'edit' | 'pen'>('edit');
  const [curveMode, setCurveMode] = useState<'disconnected' | 'mirrored' | 'aligned'>('mirrored');
  const [activePointIdx, setActivePointIdx] = useState<number | null>(null);
  const [dragMode, setDragMode] = useState<'anchor' | 'handleIn' | 'handleOut' | 'newHandle' | null>(null);
  const [drawingHandle, setDrawingHandle] = useState<{x:number, y:number} | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const points: BezierPoint[] = (Array.isArray(data.params.points) ? data.params.points : []).map((p: any) => {
      if (!p) return { x: 0.5, y: 0.5, handleIn: {x:0.5,y:0.5}, handleOut: {x:0.5,y:0.5} };
      const x = p.x ?? 0.5;
      const y = p.y ?? 0.5;
      const hIn = p.handleIn || { x, y };
      const hOut = p.handleOut || { x, y };
      return { 
        x, 
        y, 
        handleIn: { x: hIn.x ?? x, y: hIn.y ?? y }, 
        handleOut: { x: hOut.x ?? x, y: hOut.y ?? y } 
      };
  });

  const incomingEdge = edges.find(e => e.target === id && e.targetHandle === 'in');
  const hasInput = !!incomingEdge;
  const EDITOR_SIZE = 240;
  const PURPLE = '#a855f7';
  const WHITE = 'white';

  const getMousePos = (e: React.PointerEvent | React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
    };
  };

  const updatePoint = (idx: number, updates: Partial<BezierPoint>) => {
      const newPoints = [...points];
      newPoints[idx] = { ...newPoints[idx], ...updates };
      updateParams(id, { points: newPoints });
  };

  const handleMouseDown = (e: React.PointerEvent, idx: number, type: 'anchor' | 'handleIn' | 'handleOut') => {
    e.preventDefault(); e.stopPropagation();
    if (!points[idx]) return;
    const point = points[idx];
    if (type === 'handleIn' && !point.handleIn) return;
    if (type === 'handleOut' && !point.handleOut) return;

    if (toolMode === 'pen' && type === 'anchor') {
       if (idx === 0 && points.length > 2 && activePointIdx !== null) {
           handleCanvasClick(e);
           return;
       }
    }
    setActivePointIdx(idx);
    setDragMode(type);
    const pos = getMousePos(e);
    let targetX = point.x;
    let targetY = point.y;
    if (type === 'handleIn' && point.handleIn) {
        targetX = point.handleIn.x;
        targetY = point.handleIn.y;
    } else if (type === 'handleOut' && point.handleOut) {
        targetX = point.handleOut.x;
        targetY = point.handleOut.y;
    }
    dragOffsetRef.current = { x: pos.x - targetX, y: pos.y - targetY };
    if (svgRef.current) svgRef.current.setPointerCapture(e.pointerId);
  };

  const handleMouseMove = (e: React.PointerEvent) => {
    if (!svgRef.current || activePointIdx === null || !dragMode || !points[activePointIdx]) return;
    e.preventDefault(); e.stopPropagation();
    const pos = getMousePos(e);
    const pt = points[activePointIdx];
    const targetX = pos.x - dragOffsetRef.current.x;
    const targetY = pos.y - dragOffsetRef.current.y;

    if (dragMode === 'anchor') {
        const dx = targetX - pt.x;
        const dy = targetY - pt.y;
        updatePoint(activePointIdx, {
            x: targetX,
            y: targetY,
            handleIn: { x: pt.handleIn.x + dx, y: pt.handleIn.y + dy },
            handleOut: { x: pt.handleOut.x + dx, y: pt.handleOut.y + dy }
        });
    } 
    else if (dragMode === 'handleIn') {
        const newHandleIn = { x: targetX, y: targetY };
        let newHandleOut = pt.handleOut;
        if (curveMode === 'mirrored') {
            newHandleOut = { x: pt.x + (pt.x - targetX), y: pt.y + (pt.y - targetY) };
        } else if (curveMode === 'aligned') {
            const len = Math.sqrt((pt.handleOut.x - pt.x)**2 + (pt.handleOut.y - pt.y)**2);
            const angle = Math.atan2(targetY - pt.y, targetX - pt.x);
            newHandleOut = { x: pt.x + len * Math.cos(angle + Math.PI), y: pt.y + len * Math.sin(angle + Math.PI) };
        }
        updatePoint(activePointIdx, { handleIn: newHandleIn, handleOut: newHandleOut });
    }
    else if (dragMode === 'handleOut') {
        const newHandleOut = { x: targetX, y: targetY };
        let newHandleIn = pt.handleIn;
        if (curveMode === 'mirrored') {
            newHandleIn = { x: pt.x + (pt.x - targetX), y: pt.y + (pt.y - targetY) };
        } else if (curveMode === 'aligned') {
            const len = Math.sqrt((pt.handleIn.x - pt.x)**2 + (pt.handleIn.y - pt.y)**2);
            const angle = Math.atan2(targetY - pt.y, targetX - pt.x);
            newHandleIn = { x: pt.x + len * Math.cos(angle + Math.PI), y: pt.y + len * Math.sin(angle + Math.PI) };
        }
        updatePoint(activePointIdx, { handleIn: newHandleIn, handleOut: newHandleOut });
    }
    else if (dragMode === 'newHandle' && toolMode === 'pen') {
        const newHandleOut = { x: targetX, y: targetY };
        const newHandleIn = { x: pt.x + (pt.x - targetX), y: pt.y + (pt.y - targetY) };
        updatePoint(activePointIdx, { handleIn: newHandleIn, handleOut: newHandleOut });
        setDrawingHandle({ x: targetX, y: targetY });
    }
  };

  const handleMouseUp = (e: React.PointerEvent) => {
      e.stopPropagation();
      if (svgRef.current) svgRef.current.releasePointerCapture(e.pointerId);
      if (toolMode === 'pen' && dragMode === 'newHandle') setDrawingHandle(null);
      setDragMode(null);
  };

  const handleAnchorDoubleClick = (e: React.MouseEvent, idx: number) => {
      e.stopPropagation(); if (!points[idx]) return;
      const p = points[idx];
      const isSharp = (Math.abs(p.handleIn.x - p.x) < 0.001 && Math.abs(p.handleIn.y - p.y) < 0.001);
      if (isSharp) { const dist = 0.1; updatePoint(idx, { handleIn: { x: p.x - dist, y: p.y }, handleOut: { x: p.x + dist, y: p.y } }); } 
      else { updatePoint(idx, { handleIn: { x: p.x, y: p.y }, handleOut: { x: p.x, y: p.y } }); }
  };

  const handleCanvasClick = (e: React.PointerEvent | React.MouseEvent) => {
      e.stopPropagation(); if (toolMode !== 'pen' || dragMode) return;
      const { x, y } = getMousePos(e);
      const newPoints = [...points];
      if (newPoints.length === 0) {
          newPoints.push({ x, y, handleIn: {x,y}, handleOut: {x,y} });
          updateParams(id, { points: newPoints }); setActivePointIdx(0);
          setDragMode('newHandle'); setDrawingHandle({ x, y }); dragOffsetRef.current = { x: 0, y: 0 };
      } else {
          const first = newPoints[0];
          const dist = Math.sqrt((x - first.x)**2 + (y - first.y)**2);
          if (dist < 0.05) { setActivePointIdx(0); setDragMode('newHandle'); setDrawingHandle({ x: first.x, y: first.y }); dragOffsetRef.current = { x: 0, y: 0 }; return; }
          newPoints.push({ x, y, handleIn: { x, y }, handleOut: { x, y } });
          updateParams(id, { points: newPoints }); setActivePointIdx(newPoints.length - 1);
          setDragMode('newHandle'); dragOffsetRef.current = { x: 0, y: 0 }; setDrawingHandle({ x, y });
      }
  };

  const handleFinish = (e: React.MouseEvent) => {
    e.stopPropagation();
    setToolMode('edit');
    setActivePointIdx(null);
    setDrawingHandle(null);
    // updateParams(id, { showPreview: true }); // Removed Preview Toggle
  };

  const handleKeyDown = (e: any) => {
      if (e.key === 'Escape' && toolMode === 'pen') { updateParams(id, { points: [] }); setActivePointIdx(null); setDrawingHandle(null); }
      if ((e.key === 'Backspace' || e.key === 'Delete') && activePointIdx !== null) {
          const newPoints = points.filter((_, i) => i !== activePointIdx);
          updateParams(id, { points: newPoints }); setActivePointIdx(null);
      }
  };

  useEffect(() => { if (selected) { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); } }, [selected, activePointIdx, points]);

  const handleImport = (e: React.MouseEvent) => {
     e.stopPropagation();
    if (!incomingEdge) return;
    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode) return;

    let newPoints: BezierPoint[] = [];
    const k = 0.55228; 

    if (sourceNode.data.type === NodeType.RECTANGLE) {
        const l=0.2, r=0.8, t=0.2, b=0.8;
        newPoints = [
            { x: l, y: t, handleIn: {x:l,y:t}, handleOut: {x:l,y:t} },
            { x: r, y: t, handleIn: {x:r,y:t}, handleOut: {x:r,y:t} },
            { x: r, y: b, handleIn: {x:r,y:b}, handleOut: {x:r,y:b} },
            { x: l, y: b, handleIn: {x:l,y:b}, handleOut: {x:l,y:b} }
        ];
    }
    else if (sourceNode.data.type === NodeType.CIRCLE) {
        const cx = 0.5, cy = 0.5, rad = 0.35;
        newPoints = [
            { x: cx, y: cy-rad, handleIn: {x:cx-rad*k, y:cy-rad}, handleOut: {x:cx+rad*k, y:cy-rad} },
            { x: cx+rad, y: cy, handleIn: {x:cx+rad, y:cy-rad*k}, handleOut: {x:cx+rad, y:cy+rad*k} },
            { x: cx, y: cy+rad, handleIn: {x:cx+rad*k, y:cy+rad}, handleOut: {x:cx-rad*k, y:cy+rad} },
            { x: cx-rad, y: cy, handleIn: {x:cx-rad, y:cy+rad*k}, handleOut: {x:cx-rad, y:cy-rad*k} },
        ];
    }
    else {
        const pts = sourceNode.data.params.points || 5;
        for(let i=0; i<pts; i++) {
            const angle = (Math.PI * 2 * i) / pts - Math.PI/2;
            const x = 0.5 + 0.35 * Math.cos(angle);
            const y = 0.5 + 0.35 * Math.sin(angle);
            newPoints.push({ x, y, handleIn: {x,y}, handleOut: {x,y} });
        }
    }
    if (newPoints.length > 0) {
        updateParams(id, { points: newPoints });
        setToolMode('edit');
        setActivePointIdx(null);
    }
  };

  const renderPoints = points.map(p => ({
      x: p.x * EDITOR_SIZE, y: p.y * EDITOR_SIZE,
      handleIn: { x: p.handleIn.x * EDITOR_SIZE, y: p.handleIn.y * EDITOR_SIZE },
      handleOut: { x: p.handleOut.x * EDITOR_SIZE, y: p.handleOut.y * EDITOR_SIZE }
  }));
  const pathData = getBezierPath(renderPoints, true);
  let tempLine = null;
  if (toolMode === 'pen' && drawingHandle && activePointIdx !== null && renderPoints[activePointIdx]) {
      const pt = renderPoints[activePointIdx]; const h = { x: drawingHandle.x * EDITOR_SIZE, y: drawingHandle.y * EDITOR_SIZE };
      tempLine = <line x1={pt.x} y1={pt.y} x2={h.x} y2={h.y} stroke={PURPLE} strokeWidth="1" opacity="0.6" pointerEvents="none" />;
  }

  return (
    <BaseNode 
        id={id} 
        label="Pen Tool (Bitmap)" 
        selected={selected} 
        inputs={['in']} 
        outputs={[{ id: 'out', type: 'bitmap' }]} 
        headerColor="bg-emerald-500/80" 
        // removed showPreview
        className="w-[270px]"
    >
       <div className="flex flex-col gap-3">
         <div className="grid grid-cols-2 gap-2">
            <button onClick={(e) => { e.stopPropagation(); setToolMode('edit'); setActivePointIdx(null); }} className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all ${toolMode === 'edit' ? 'bg-[#27272a] border-purple-500 text-white' : 'bg-[#18181b] border-transparent text-gray-500 hover:bg-[#27272a]'}`}>
                <PenIcons.Edit active={toolMode === 'edit'} />
                <span className="text-[9px] mt-1">Edit Shape</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setToolMode('pen'); updateParams(id, { points: [] }); setActivePointIdx(null); }} className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all ${toolMode === 'pen' ? 'bg-[#27272a] border-purple-500 text-white' : 'bg-[#18181b] border-transparent text-gray-500 hover:bg-[#27272a]'}`}>
                <PenIcons.Pen active={toolMode === 'pen'} />
                <span className="text-[9px] mt-1">Pen Tool</span>
            </button>
         </div>

         {toolMode === 'edit' && (
             <div>
                <div className="text-[10px] text-gray-500 mb-1 font-medium">Handle Mode</div>
                <div className="grid grid-cols-3 gap-1">
                    {(['disconnected', 'mirrored', 'aligned'] as const).map(m => (
                        <button key={m} onClick={(e) => { e.stopPropagation(); setCurveMode(m); }} className={`flex items-center justify-center p-1 rounded border transition-all ${curveMode === m ? 'bg-[#27272a] border-purple-500' : 'bg-[#18181b] border-transparent hover:bg-[#27272a]'}`} title={m}>
                            {m === 'disconnected' && <PenIcons.Disconnected active={curveMode === m} />}
                            {m === 'mirrored' && <PenIcons.Mirrored active={curveMode === m} />}
                            {m === 'aligned' && <PenIcons.Aligned active={curveMode === m} />}
                        </button>
                    ))}
                </div>
             </div>
         )}

         <div className={`w-full aspect-square bg-[#09090b] rounded border border-white/10 relative overflow-hidden group/editor select-none ${toolMode === 'pen' ? 'nodrag' : ''}`} style={{ height: EDITOR_SIZE }}>
            <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${EDITOR_SIZE} ${EDITOR_SIZE}`} className={`touch-none ${toolMode === 'pen' ? 'cursor-crosshair' : 'cursor-default'}`} onPointerDown={(e) => toolMode === 'pen' && handleCanvasClick(e)} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp}>
               <defs><pattern id={`grid_${id}`} width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/></pattern></defs>
               <rect width="100%" height="100%" fill={`url(#grid_${id})`} />
               <path d={pathData} fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="2" className="pointer-events-none" />
               {tempLine}
               {renderPoints.map((p, i) => {
                   const isActive = i === activePointIdx;
                   const showHandles = toolMode === 'edit' || (isActive && toolMode === 'pen');
                   const isSharp = Math.abs(p.handleIn.x - p.x) < 1 && Math.abs(p.handleIn.y - p.y) < 1;
                   const lineColor = isActive ? PURPLE : '#52525b';
                   const knobFillColor = (dragMode && isActive) ? PURPLE : '#18181b';
                   const knobStrokeColor = isActive ? PURPLE : '#52525b';
                   const anchorFill = isActive ? PURPLE : WHITE;
                   const anchorStroke = isActive ? PURPLE : '#52525b';
                   return (
                       <g key={i}>
                           {showHandles && (
                               <>
                                 <line x1={p.x} y1={p.y} x2={p.handleIn.x} y2={p.handleIn.y} stroke={lineColor} strokeWidth="1" opacity={isActive ? "0.8" : "0.5"} pointerEvents="none" />
                                 <line x1={p.x} y1={p.y} x2={p.handleOut.x} y2={p.handleOut.y} stroke={lineColor} strokeWidth="1" opacity={isActive ? "0.8" : "0.5"} pointerEvents="none" />
                               </>
                           )}
                           <rect x={p.x - 4} y={p.y - 4} width={8} height={8} fill={anchorFill} stroke={anchorStroke} strokeWidth={1} className="cursor-move nodrag" onPointerDown={(e) => handleMouseDown(e, i, 'anchor')} onDoubleClick={(e) => handleAnchorDoubleClick(e, i)}>
                               <title>Double Click to Toggle Smooth/Sharp</title>
                           </rect>
                           {showHandles && (
                               <>
                                 {!isSharp && (
                                    <>
                                        <circle cx={p.handleIn.x} cy={p.handleIn.y} r={3.5} fill={dragMode === 'handleIn' && isActive ? PURPLE : knobFillColor} stroke={knobStrokeColor} strokeWidth="1.5" className="cursor-grab nodrag" onPointerDown={(e) => handleMouseDown(e, i, 'handleIn')} />
                                        <circle cx={p.handleOut.x} cy={p.handleOut.y} r={3.5} fill={dragMode === 'handleOut' && isActive ? PURPLE : knobFillColor} stroke={knobStrokeColor} strokeWidth="1.5" className="cursor-grab nodrag" onPointerDown={(e) => handleMouseDown(e, i, 'handleOut')} />
                                    </>
                                 )}
                               </>
                           )}
                       </g>
                   );
               })}
            </svg>
            {hasInput && <button onClick={handleImport} className="absolute top-2 right-2 bg-purple-600/90 hover:bg-purple-500 text-white p-1.5 rounded shadow-lg transition-colors" title="Import shape"><RefreshCw size={12} /></button>}
         </div>
         <div className="text-[9px] text-center text-gray-500 -mt-1">Double-click anchor points to toggle Smooth/Sharp</div>
         <button onClick={handleFinish} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/20"><Check size={12} /> Add Graphics</button>
         <div className="flex gap-2 mt-1">
            <button onClick={(e) => { e.stopPropagation(); updateParams(id, { points: [] }); setActivePointIdx(null); setDrawingHandle(null); }} className="flex-1 py-1.5 bg-[#27272a] hover:bg-[#3f3f46] border border-white/5 rounded text-[10px] text-white transition-colors">Clear Path</button>
         </div>
       </div>
       {/* Removed NodePreview */}
    </BaseNode>
  );
};

// --- Trace Node Implementation ---
const TraceNode = ({ id, data, selected }: any) => {
    const updateParams = useStore(s => s.updateNodeParams);
    return (
        <BaseNode 
            id={id} 
            label="Trace (To Vector)" 
            selected={selected} 
            inputs={[{ id: 'in', type: 'bitmap' }]} // Green Input
            outputs={['out']} // Blue Output
            headerColor="bg-blue-500/80" 
            showPreview={data.params.showPreview}
        >
            <div className="flex flex-col gap-2">
                <SliderControl label="Threshold" value={data.params.threshold ?? 0.5} min={0} max={1} step={0.01} onChange={(v:number) => updateParams(id, {threshold:v})} />
                
                <div className="flex items-center justify-between px-1">
                     <label className="text-[10px] text-gray-500 font-medium">Invert</label>
                     <input type="checkbox" className="accent-purple-500 cursor-pointer" checked={data.params.invert ?? false} onChange={(e) => updateParams(id, {invert: e.target.checked})} />
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-[10px] text-gray-500 font-medium px-1">Fidelity (Grid)</label>
                    <select 
                      className="w-full bg-[#09090b] border border-white/10 rounded px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                      value={data.params.fidelity ?? 128}
                      onChange={(e) => updateParams(id, { fidelity: parseInt(e.target.value) })}
                    >
                      <option value="64">Low (64px)</option>
                      <option value="128">Medium (128px)</option>
                      <option value="256">High (256px)</option>
                      <option value="512">Ultra (512px)</option>
                    </select>
                </div>
            </div>
            <NodePreview nodeId={id} visible={data.params.showPreview === true} />
        </BaseNode>
    );
};

// ... keep GradientNode ...
const GradientNode = ({ id, data, selected }: any) => {
  const updateParams = useStore(s => s.updateNodeParams);
  const stops: any[] = data.params.stops || [{ id: '1', offset: 0, color: '#000000', opacity: 1 }, { id: '2', offset: 1, color: '#ffffff', opacity: 1 }];
  const handleAddStop = () => { const newStop = { id: Date.now().toString(), offset: 0.5, color: '#888888', opacity: 1 }; const newStops = [...stops, newStop].sort((a, b) => a.offset - b.offset); updateParams(id, { stops: newStops }); };
  const handleUpdateStop = (stopId: string, updates: any) => { const newStops = stops.map(s => s.id === stopId ? { ...s, ...updates } : s); if (updates.offset !== undefined) newStops.sort((a, b) => a.offset - b.offset); updateParams(id, { stops: newStops }); };
  const handleRemoveStop = (stopId: string) => { if (stops.length <= 2) return; const newStops = stops.filter(s => s.id !== stopId); updateParams(id, { stops: newStops }); };
  const gradientCSS = `linear-gradient(90deg, ${stops.map(s => `${s.color} ${s.offset * 100}%`).join(', ')})`;
  return (
    <BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['out']} headerColor="bg-orange-500/80" showPreview={data.params.showPreview} className="w-72">
       <div className="mb-4"><div className="w-full h-8 rounded border border-white/10 relative overflow-hidden bg-[url('https://transparent-textures.patterns.velmo.de/checkerboard.png')] bg-repeat"><div className="absolute inset-0 w-full h-full" style={{ background: gradientCSS }} /></div></div>
       <div className="mb-4 space-y-2 pb-4 border-b border-white/5"><SliderControl label="X Direction" value={data.params.x ?? 1} min={-1} max={1} step={0.1} onChange={(v:number) => updateParams(id, {x:v})} /><SliderControl label="Y Direction" value={data.params.y ?? 0} min={-1} max={1} step={0.1} onChange={(v:number) => updateParams(id, {y:v})} /><SliderControl label="Power" value={data.params.power ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateParams(id, {power:v})} /></div>
       <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stops</span><button onClick={handleAddStop} className="p-1 rounded bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 transition-colors" title="Add Stop"><Plus size={12} /></button></div>
       <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
         {stops.map((stop) => (
           <div key={stop.id} className="flex items-center gap-2 bg-black/20 p-1.5 rounded border border-white/5 group/row">
              <div className="flex flex-col w-12 shrink-0"><input type="number" min={0} max={100} value={Math.round(stop.offset * 100)} onChange={(e) => { const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); handleUpdateStop(stop.id, { offset: val / 100 }); }} className="bg-transparent text-[10px] font-mono text-gray-300 text-center border-b border-white/10 focus:border-purple-500 focus:outline-none" /><span className="text-[8px] text-gray-600 text-center">%</span></div>
              <div className="flex-1 flex items-center gap-2 bg-black/20 rounded p-1 border border-white/5 relative"><div className="w-5 h-5 rounded-sm overflow-hidden relative border border-white/10 shrink-0"><input type="color" value={stop.color} onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })} className="absolute -top-1 -left-1 w-[150%] h-[150%] p-0 border-none cursor-pointer" /></div><div className="h-4 w-[1px] bg-white/10 mx-0.5" /><div className="flex items-center gap-1 w-full"><span className="text-[9px] text-gray-500">Op</span><input type="number" min={0} max={100} value={Math.round(stop.opacity * 100)} onChange={(e) => { const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0)); handleUpdateStop(stop.id, { opacity: val / 100 }); }} className="w-full bg-transparent text-[10px] text-gray-300 focus:outline-none" /><span className="text-[9px] text-gray-600">%</span></div></div>
              <button onClick={() => handleRemoveStop(stop.id)} disabled={stops.length <= 2} className={`p-1 text-gray-600 hover:text-red-400 transition-colors ${stops.length <= 2 ? 'opacity-20 cursor-not-allowed' : ''}`}><Trash2 size={12} /></button>
           </div>
         ))}
       </div>
       <NodePreview nodeId={id} visible={data.params.showPreview === true} />
    </BaseNode>
  );
};
const ColorNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label={data.label} selected={selected} inputs={['in']} outputs={['rgba']} headerColor="bg-emerald-500/80" showPreview={false}><div className="flex gap-2 mb-2"><div className="w-full h-8 rounded border border-white/10 shadow-inner relative overflow-hidden"><div className="absolute inset-0 checkerboard-bg opacity-20" /><div className="absolute inset-0" style={{ backgroundColor: `rgba(${data.params.r ?? 255},${data.params.g ?? 255},${data.params.b ?? 255}, 1)` }} /></div></div><SliderControl label="Red" value={data.params.r ?? 255} min={0} max={255} step={1} onChange={(v:number) => updateParams(id, {r:v})} /><SliderControl label="Green" value={data.params.g ?? 255} min={0} max={255} step={1} onChange={(v:number) => updateParams(id, {g:v})} /><SliderControl label="Blue" value={data.params.b ?? 255} min={0} max={255} step={1} onChange={(v:number) => updateParams(id, {b:v})} /></BaseNode>); };
const ValueNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={['val']} headerColor="bg-emerald-500/80" showPreview={false}><SliderControl label="Luminance" value={data.params.value ?? 0.5} min={0} max={1} onChange={(v:number) => updateParams(id, {value:v})} /></BaseNode>); };
const AlphaNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label={data.label} selected={selected} inputs={['in']} outputs={['alpha']} headerColor="bg-emerald-500/80" showPreview={data.params.showPreview}><div className="flex gap-2 mb-2"><div className="w-full h-8 rounded border border-white/10 shadow-inner relative overflow-hidden"><div className="absolute inset-0 checkerboard-bg opacity-20" /><div className="absolute inset-0 bg-white transition-opacity" style={{ opacity: data.params.value ?? 1 }} /></div></div><SliderControl label="Opacity" value={data.params.value ?? 1} min={0} max={1} onChange={(v:number) => updateParams(id, {value:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const ImageNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); const inputRef = useRef<HTMLInputElement>(null); const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { updateParams(id, { imageSrc: event.target?.result }); }; reader.readAsDataURL(file); } }; const hasImage = !!data.params.imageSrc; return (<BaseNode id={id} label={data.label} selected={selected} inputs={[]} outputs={[{ id: 'rgba', type: 'bitmap' }]} headerColor="bg-emerald-500/80" showPreview={false}><input type="file" ref={inputRef} onChange={handleUpload} accept="image/*" className="hidden" /><div className="w-full aspect-square bg-black/50 rounded border border-white/10 relative overflow-hidden group/image">{hasImage ? (<><img src={data.params.imageSrc} alt="Uploaded" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:image:opacity-100 transition-opacity"><button onClick={() => inputRef.current?.click()} className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs text-white backdrop-blur-sm">Change</button></div></>) : (<div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => inputRef.current?.click()}><ImageIcon size={24} /><span className="text-xs">Click to Upload</span></div>)}</div></BaseNode>); };
const MathAddNode = ({ id, data, selected }: any) => (<BaseNode id={id} label="Add (Union)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}><div className="flex flex-col gap-4 py-1"><div className="flex justify-between items-center text-[10px] text-gray-500 px-1"><span>Input A</span><span>Input B</span></div><div className="text-[10px] text-gray-600 text-center italic">A + B (Union)</div><NodePreview nodeId={id} visible={data.params.showPreview === true} /></div></BaseNode>);
const MathSubNode = ({ id, data, selected }: any) => (<BaseNode id={id} label="Subtract (Difference)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}><div className="flex flex-col gap-4 py-1"><div className="flex justify-between items-center text-[10px] text-gray-500 px-1"><span>Input A</span><span>Input B</span></div><div className="text-[10px] text-gray-600 text-center italic">A - B (Difference)</div><NodePreview nodeId={id} visible={data.params.showPreview === true} /></div></BaseNode>);
const MathMultiplyNode = ({ id, data, selected }: any) => (<BaseNode id={id} label="Multiply (Intersection)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}><div className="flex flex-col gap-4 py-1"><div className="flex justify-between items-center text-[10px] text-gray-500 px-1"><span>Input A</span><span>Input B</span></div><div className="text-[10px] text-gray-600 text-center italic">A &times; B (Intersection)</div><NodePreview nodeId={id} visible={data.params.showPreview === true} /></div></BaseNode>);
const MathDivideNode = ({ id, data, selected }: any) => (<BaseNode id={id} label="Divide (Exclusion)" selected={selected} inputs={['a', 'b']} outputs={['out']} headerColor="bg-rose-500/80" showPreview={data.params.showPreview}><div className="flex flex-col gap-4 py-1"><div className="flex justify-between items-center text-[10px] text-gray-500 px-1"><span>Input A</span><span>Input B</span></div><div className="text-[10px] text-gray-600 text-center italic">A &#8853; B (Exclusion)</div><NodePreview nodeId={id} visible={data.params.showPreview === true} /></div></BaseNode>);
const FillNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Fill" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><div className="flex items-center justify-between mb-2 px-1"><label className="text-[10px] text-gray-500 font-medium">Fill Enabled</label><input type="checkbox" className="accent-purple-500 cursor-pointer" checked={data.params.fillEnabled ?? true} onChange={(e) => updateParams(id, {fillEnabled: e.target.checked})} /></div><SliderControl label="Stroke Width" value={data.params.strokeWidth ?? 0} min={0} max={20} step={0.5} onChange={(v:number) => updateParams(id, {strokeWidth:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const GlowNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Hard Glow" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><SliderControl label="Radius" value={data.params.radius ?? 20} min={1} max={100} step={1} onChange={(v:number) => updateParams(id, {radius:v})} /><SliderControl label="Intensity" value={data.params.intensity ?? 1.5} min={0} max={5} onChange={(v:number) => updateParams(id, {intensity:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const NeonNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Neon" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><SliderControl label="Radius" value={data.params.radius ?? 15} min={1} max={100} step={1} onChange={(v:number) => updateParams(id, {radius:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const SoftBlurNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Soft Blur" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><SliderControl label="Radius" value={data.params.radius ?? 5} min={0} max={50} step={1} onChange={(v:number) => updateParams(id, {radius:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const StrokeNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Stroke" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><SliderControl label="Width" value={data.params.width ?? 1} min={0} max={20} step={0.5} onChange={(v:number) => updateParams(id, {width:v})} /><SliderControl label="Opacity" value={data.params.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v:number) => updateParams(id, {opacity:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const GradientFadeNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Gradient Fade" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><SliderControl label="Angle" value={data.params.direction ?? 90} min={0} max={360} step={1} onChange={(v:number) => updateParams(id, {direction:v})} /><SliderControl label="Start Opacity" value={data.params.start ?? 1} min={0} max={1} onChange={(v:number) => updateParams(id, {start:v})} /><SliderControl label="End Opacity" value={data.params.end ?? 0} min={0} max={1} onChange={(v:number) => updateParams(id, {end:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const PixelateNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Pixelate / Rasterize" selected={selected} inputs={['in']} outputs={[{ id: 'out', type: 'bitmap' }]} headerColor="bg-blue-500/80" showPreview={data.params.showPreview}><SliderControl label="Pixel Size" value={data.params.pixelSize ?? 1} min={1} max={100} step={1} onChange={(v:number) => updateParams(id, {pixelSize:v})} /><div className="text-[10px] text-gray-500 px-1 mt-1 text-center italic">Size 1 = High Res Bake</div><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const TranslateNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Translate" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}><SliderControl label="X Offset" value={data.params.x ?? 0} min={-1} max={1} onChange={(v:number) => updateParams(id, {x:v})} /><SliderControl label="Y Offset" value={data.params.y ?? 0} min={-1} max={1} onChange={(v:number) => updateParams(id, {y:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const RotateNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Rotate" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}><SliderControl label="Angle" value={data.params.angle ?? 0} min={0} max={360} step={1} onChange={(v:number) => updateParams(id, {angle:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const ScaleNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Scale" selected={selected} inputs={['in']} outputs={['out']} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}><SliderControl label="Factor" value={data.params.scale ?? 1} min={0.1} max={5} onChange={(v:number) => updateParams(id, {scale:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const PolarNode = ({ id, data, selected }: any) => { const updateParams = useStore(s => s.updateNodeParams); return (<BaseNode id={id} label="Polar Coords" selected={selected} inputs={['in']} outputs={[{ id: 'out', type: 'bitmap' }]} headerColor="bg-violet-500/80" showPreview={data.params.showPreview}><div className="flex flex-col gap-1.5 mb-2"><label className="text-[10px] text-gray-500 font-medium px-1">Mapping Mode</label><div className="relative group/select"><select className="w-full bg-[#09090b] border border-white/10 rounded px-2 py-1.5 text-[10px] text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 cursor-pointer appearance-none transition-colors" value={data.params.type || 'rect_to_polar'} onChange={(e) => updateParams(id, { type: e.target.value })} onPointerDown={(e) => e.stopPropagation()} ><option value="rect_to_polar" className="bg-[#09090b] text-gray-300">Rect to Polar (Burst)</option><option value="polar_to_rect" className="bg-[#09090b] text-gray-300">Polar to Rect (Ring)</option></select><div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 group-hover/select:text-gray-300 transition-colors"><ChevronDown size={12} /></div></div></div><SliderControl label="X Offset" value={data.params.x ?? 0} min={-1} max={1} step={0.01} onChange={(v:number) => updateParams(id, {x:v})} /><SliderControl label="Y Offset" value={data.params.y ?? 0} min={-1} max={1} step={0.01} onChange={(v:number) => updateParams(id, {y:v})} /><SliderControl label="Radial Scale" value={data.params.radialScale ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateParams(id, {radialScale:v})} /><SliderControl label="Angular Scale" value={data.params.angularScale ?? 1} min={0.1} max={5} step={0.1} onChange={(v:number) => updateParams(id, {angularScale:v})} /><NodePreview nodeId={id} visible={data.params.showPreview === true} /></BaseNode>); };
const OutputNode = ({ id, data, selected }: any) => { const textureUrl = useStore((state) => state.previewTextureUrl); return (<BaseNode id={id} label="OUTPUT" selected={selected} inputs={[{ id: 'in', type: 'any' }]} headerColor="bg-white" className="w-64" showPreview={false}><div className="flex flex-col gap-2"><div className="w-full aspect-square bg-black/50 rounded overflow-hidden border border-white/10 relative"><div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',backgroundSize: '20px 20px',backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'}} />{textureUrl ? (<img src={textureUrl} alt="Output" className="w-full h-full object-contain relative z-10" />) : (<div className="w-full h-full flex items-center justify-center text-xs text-gray-600">Waiting for render...</div>)}</div><div className="text-[10px] text-gray-500 text-center">{data.params.resolution || "512"}px Output</div></div></BaseNode>); };

export const nodeTypes = {
  custom: RectangleNode, 
  [NodeType.RECTANGLE]: memo(RectangleNode),
  [NodeType.CIRCLE]: memo(CircleNode),
  [NodeType.POLYGON]: memo(PolygonNode),
  [NodeType.WAVY_RING]: memo(WavyRingNode),
  [NodeType.BEAM]: memo(BeamNode),
  [NodeType.GRADIENT]: memo(GradientNode), 
  [NodeType.PATH]: memo(PathNode),
  [NodeType.PEN]: memo(PenToolNode),
  [NodeType.TRACE]: memo(TraceNode), // Register Trace Node
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
