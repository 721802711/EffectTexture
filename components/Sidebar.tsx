import React, { useState } from 'react';
import { 
  Palette, 
  Layers,
  Plus,
  MousePointer2,
  Hand,
  Search,
  MoreHorizontal,
  Minus,
  Percent,
  X as MultiplyIcon,
  Trash2,
  Square,
  Circle,
  Hexagon,
  Sparkles,
  Blend,
  Move,
  RotateCw,
  Maximize,
  Waves,
  Flashlight,
  Droplets,
  PenTool,
  PaintBucket,
  Zap
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { NodeType } from '../types';

// --- DATA ---

const CATEGORIES = [
  {
    id: 'generators',
    label: 'Generators',
    items: [
      { label: 'Rectangle', icon: Square, type: NodeType.RECTANGLE },
      { label: 'Circle', icon: Circle, type: NodeType.CIRCLE },
      { label: 'Polygon', icon: Hexagon, type: NodeType.POLYGON },
      { label: 'Wavy Ring', icon: Waves, type: NodeType.WAVY_RING },
      { label: 'Beam', icon: Flashlight, type: NodeType.BEAM },
    ]
  },
  {
    id: 'inputs',
    label: 'Inputs',
    items: [
      { label: 'Color', icon: Palette, type: NodeType.COLOR },
      { label: 'Value', icon: Layers, type: NodeType.VALUE },
    ]
  },
  {
    id: 'filters',
    label: 'Filters',
    items: [
      { label: 'Fill', icon: PaintBucket, type: NodeType.FILL },
      { label: 'Hard Glow', icon: Sparkles, type: NodeType.GLOW },
      { label: 'Neon', icon: Zap, type: NodeType.NEON },
      { label: 'Soft Blur', icon: Droplets, type: NodeType.SOFT_BLUR },
      { label: 'Stroke', icon: PenTool, type: NodeType.STROKE },
      { label: 'Fade', icon: Blend, type: NodeType.GRADIENT_FADE },
    ]
  },
  {
    id: 'transforms',
    label: 'Transforms',
    items: [
      { label: 'Move', icon: Move, type: NodeType.TRANSLATE },
      { label: 'Rotate', icon: RotateCw, type: NodeType.ROTATE },
      { label: 'Scale', icon: Maximize, type: NodeType.SCALE },
    ]
  },
  {
    id: 'math',
    label: 'Math',
    items: [
      { label: 'Add', icon: Plus, type: NodeType.ADD },
      { label: 'Subtract', icon: Minus, type: NodeType.SUBTRACT },
      { label: 'Multiply', icon: MultiplyIcon, type: NodeType.MULTIPLY },
      { label: 'Divide', icon: Percent, type: NodeType.DIVIDE },
    ]
  }
];

// --- COMPONENTS ---

const DraggableMenuItem = ({ label, icon: Icon, type, onDragStart }: any) => (
  <div 
    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all group"
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData('application/reactflow', type);
      event.dataTransfer.effectAllowed = 'move';
      if (onDragStart) onDragStart();
    }}
  >
    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-colors">
      <Icon size={18} className="text-gray-400 group-hover:text-purple-400" />
    </div>
    <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-200">{label}</span>
  </div>
);

const ToolbarButton = ({ icon: Icon, active, onClick, purple, danger }: any) => (
  <button 
    onClick={onClick}
    className={clsx(
      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
      purple && active 
        ? "bg-purple-500 text-white shadow-lg shadow-purple-900/50 scale-110" 
        : active 
          ? "bg-purple-500 text-white" 
          : danger 
            ? "text-red-500 hover:bg-red-500/20"
            : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
    )}
  >
    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
  </button>
);

// --- MAIN ---

const Sidebar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { interactionMode, setInteractionMode, deleteSelection } = useStore();

  const handleDragStart = () => {
    // Close the menu immediately when dragging starts.
    // This removes the backdrop overlay, allowing the drop event to reach the canvas underneath.
    setTimeout(() => {
        setIsMenuOpen(false);
    }, 10);
  };

  // Filter categories based on search
  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <>
      {/* --- BACKDROP FOR CLICK OUTSIDE --- */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* --- POPUP MENU (The Grid) --- */}
      <div 
        className={clsx(
          "absolute bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 origin-bottom",
          isMenuOpen 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <div 
          className="bg-[#1a1a1d]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl w-[600px]"
          onClick={(e) => e.stopPropagation()} 
        >
          
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
            />
          </div>

          {/* Grid Categories */}
          <div className="grid grid-cols-5 gap-4">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <div key={cat.id} className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider px-2 text-center">{cat.label}</h3>
                  <div className="flex flex-col gap-1 items-center">
                    {cat.items.map(item => (
                      <DraggableMenuItem 
                        key={item.type} 
                        {...item} 
                        onDragStart={handleDragStart} 
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-5 text-center text-gray-500 py-4 text-xs">
                No nodes found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- FLOATING DOCK (Toolbar) --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="flex items-center gap-2 px-2 py-2 bg-[#1a1a1d]/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl">
          
          {/* Close / System Actions */}
          <div className="flex items-center gap-1 pr-2 border-r border-white/10">
            <ToolbarButton icon={Trash2} onClick={deleteSelection} danger />
            <ToolbarButton icon={MoreHorizontal} />
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1 pl-2">
            
            {/* Add Node (Toggle Menu) */}
            <ToolbarButton 
              icon={Plus} 
              purple 
              active={isMenuOpen} 
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                if (!isMenuOpen) {
                  setInteractionMode('select');
                }
                // Clear search on open/close
                if (!isMenuOpen) setSearchTerm('');
              }} 
            />
            
            <ToolbarButton 
              icon={MousePointer2} 
              active={!isMenuOpen && interactionMode === 'select'} 
              onClick={() => {
                setInteractionMode('select');
                setIsMenuOpen(false);
              }} 
            />
            
            <ToolbarButton 
              icon={Hand} 
              active={!isMenuOpen && interactionMode === 'hand'} 
              onClick={() => {
                setInteractionMode('hand');
                setIsMenuOpen(false);
              }} 
            />
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;