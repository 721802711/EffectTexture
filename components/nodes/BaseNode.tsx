import React from 'react';
import { Handle, Position } from 'reactflow';
import clsx from 'clsx';
import { Settings2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../store';

export type HandleType = 'svg' | 'bitmap' | 'any';

export interface HandleConfig {
  id: string;
  type?: HandleType;
}

// Helper to normalize input props (allow string or object)
const normalizeHandles = (handles: (string | HandleConfig)[]): HandleConfig[] => {
  return handles.map(h => typeof h === 'string' ? { id: h, type: 'svg' } : { type: 'svg', ...h });
};

const getHandleColorClass = (type?: HandleType) => {
  switch (type) {
    case 'bitmap':
      return '!bg-green-500 !border-green-300';
    case 'any':
      return '!bg-gray-400 !border-gray-200';
    case 'svg':
    default:
      return '!bg-blue-500 !border-blue-300';
  }
};

interface BaseNodeProps {
  id?: string;
  label: string;
  selected?: boolean;
  inputs?: (string | HandleConfig)[];
  outputs?: (string | HandleConfig)[];
  children: React.ReactNode;
  headerColor?: string;
  className?: string;
  showPreview?: boolean;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  id,
  label, 
  selected, 
  inputs = [], 
  outputs = [], 
  children,
  headerColor = 'border-l-purple-500',
  className,
  showPreview
}) => {
  const setEditingNodeId = useStore(s => s.setEditingNodeId);
  const updateNodeParams = useStore(s => s.updateNodeParams);
  
  const accentClass = headerColor.includes('border') ? headerColor : 'border-l-gray-500';

  // Default is OFF (undefined or false)
  const isPreviewVisible = showPreview === true;

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      updateNodeParams(id, { showPreview: !isPreviewVisible });
    }
  };

  const normalizedInputs = normalizeHandles(inputs);
  const normalizedOutputs = normalizeHandles(outputs);

  return (
    <div className={clsx(
      "rounded-lg shadow-2xl overflow-hidden transition-all duration-200 relative group",
      className || "w-60", 
      "bg-[#18181b] border",
      selected 
        ? "border-purple-500/50 shadow-purple-500/10" 
        : "border-white/5 hover:border-white/10"
    )}>
      
      {/* Accent Strip */}
      <div className={clsx("absolute top-0 bottom-0 left-0 w-1", accentClass.replace('bg-', 'bg-'))} />

      {/* Inputs (Left) */}
      {normalizedInputs.map((handle, index) => (
         <Handle 
           key={`in-${handle.id}`}
           type="target" 
           position={Position.Left} 
           id={handle.id}
           style={{ top: 42 + index * 24 }}
           className={clsx(
             "w-3 h-3 !rounded-[2px] border transition-colors",
             getHandleColorClass(handle.type)
           )}
         />
      ))}

      {/* Outputs (Right) */}
      {normalizedOutputs.map((handle, index) => (
         <Handle 
           key={`out-${handle.id}`}
           type="source" 
           position={Position.Right} 
           id={handle.id}
           style={{ top: 42 + index * 24 }}
           className={clsx(
             "w-3 h-3 !rounded-[2px] border transition-colors",
             getHandleColorClass(handle.type)
           )}
         />
      ))}

      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 pl-4 bg-white/[0.02] border-b border-white/5">
        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider truncate">{label}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {/* Toggle Preview Icon */}
           {id && showPreview !== undefined && ( 
             <button 
               className="nodrag text-gray-500 hover:text-white hover:bg-white/10 p-1 rounded"
               onClick={togglePreview}
               title={isPreviewVisible ? "Hide Preview" : "Show Preview"}
             >
               {isPreviewVisible ? <Eye size={12} /> : <EyeOff size={12} />}
             </button>
           )}

           {/* Settings Icon - Trigger Inspector */}
           <button 
             className="nodrag text-gray-600 hover:text-white hover:bg-white/10 p-1 rounded"
             onClick={(e) => {
               e.stopPropagation();
               if (id) {
                 const rect = e.currentTarget.getBoundingClientRect();
                 setEditingNodeId(id, { x: rect.right + 10, y: rect.top });
               }
             }}
           >
             <Settings2 size={12} />
           </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {children}
      </div>
    </div>
  );
};
