import React from 'react';
import clsx from 'clsx';

export const SliderControl = ({ label, value, min, max, step = 0.01, onChange, className }: any) => {
  // Local handler to ensure input is valid number
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onChange(val);
    }
  };

  return (
    <div className={clsx("flex flex-col gap-1.5 mb-2", className)}>
      <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium select-none">
        <span>{label}</span>
        <input 
          type="number"
          className="w-12 bg-black/20 border border-white/5 rounded px-1 py-0.5 text-right text-gray-300 font-mono text-[10px] focus:outline-none focus:border-purple-500/50 nodrag"
          value={Number(value).toFixed(2).replace(/\.00$/, '')}
          onChange={handleInputChange}
          step={step}
          onPointerDown={(e) => e.stopPropagation()} 
        />
      </div>
      
      {/* 
        CRITICAL FIX: 
        1. 'nodrag' class prevents ReactFlow from dragging the node when clicking this area.
        2. stopPropagation prevents the click from bubbling up to the node selection handler.
      */}
      <div 
        className="relative flex items-center w-full h-4 group nodrag cursor-default" 
        onPointerDown={(e) => e.stopPropagation()}
      >
          <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="nodrag absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          {/* Track */}
          <div className="w-full h-0.5 bg-[#27272a] rounded-full overflow-hidden pointer-events-none">
              <div 
                  className="h-full bg-purple-500/50 transition-all duration-75 ease-out" 
                  style={{ width: `${((value - min) / (max - min)) * 100}%` }}
              />
          </div>
          
          {/* Thumb */}
          <div 
              className="absolute w-3.5 h-3.5 bg-purple-500 border border-[#09090b] rounded-full shadow-md pointer-events-none transition-all duration-75 ease-out flex items-center justify-center"
              style={{ 
                left: `calc(${((value - min) / (max - min)) * 100}% - 7px)`,
              }}
          >
            <div className="w-1 h-1 bg-white/20 rounded-full" />
          </div>
      </div>
    </div>
  );
};