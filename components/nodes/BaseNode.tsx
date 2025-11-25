import React from 'react';
import { Handle, Position } from 'reactflow';
import clsx from 'clsx';
import { Settings2 } from 'lucide-react';
import { useStore } from '../../store';

interface BaseNodeProps {
  id?: string;
  label: string;
  selected?: boolean;
  inputs?: string[];
  outputs?: string[];
  children: React.ReactNode;
  headerColor?: string;
  className?: string;
}

export const BaseNode: React.FC<BaseNodeProps> = ({ 
  id,
  label, 
  selected, 
  inputs = [], 
  outputs = [], 
  children,
  headerColor = 'border-l-purple-500',
  className
}) => {
  const setEditingNodeId = useStore(s => s.setEditingNodeId);
  
  const accentClass = headerColor.includes('border') ? headerColor : 'border-l-gray-500';

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

      {/* Handles */}
      {inputs.map((handleId, index) => (
         <Handle 
           key={`in-${handleId}`}
           type="target" 
           position={Position.Left} 
           id={handleId}
           style={{ top: 42 + index * 24 }}
           className="w-2.5 h-2.5 bg-[#3f3f46] border border-[#18181b] !rounded-sm hover:bg-purple-400 transition-colors"
         />
      ))}
       {outputs.map((handleId, index) => (
         <Handle 
           key={`out-${handleId}`}
           type="source" 
           position={Position.Right} 
           id={handleId}
           style={{ top: 42 + index * 24 }}
           className="w-2.5 h-2.5 bg-[#3f3f46] border border-[#18181b] !rounded-sm hover:bg-purple-400 transition-colors"
         />
      ))}

      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 pl-4 bg-white/[0.02] border-b border-white/5">
        <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wider truncate">{label}</span>
        {/* Settings Icon - Trigger Inspector */}
        <button 
          className="nodrag text-gray-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:text-white hover:bg-white/10 p-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            if (id) {
              const rect = e.currentTarget.getBoundingClientRect();
              // Position popover to the right of the button
              setEditingNodeId(id, { x: rect.right + 10, y: rect.top });
            }
          }}
        >
          <Settings2 size={12} />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        {children}
      </div>
    </div>
  );
};