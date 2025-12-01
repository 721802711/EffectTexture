
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  MousePointer2,
  Hand,
  Search,
  MoreHorizontal,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { CATEGORIES } from '../data/nodeCategories';

// --- COMPONENTS ---

const DraggableMenuItem = ({ label, icon: Icon, type, onDragStart }: any) => (
  <div 
    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/10 cursor-grab active:cursor-grabbing transition-all group min-h-[80px] justify-center"
    draggable
    onDragStart={(event) => {
      event.dataTransfer.setData('application/reactflow', type);
      event.dataTransfer.effectAllowed = 'move';
      if (onDragStart) onDragStart();
    }}
  >
    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-colors shadow-sm">
      <Icon size={16} className="text-gray-400 group-hover:text-purple-400" />
    </div>
    <span className="text-[9px] font-medium text-gray-400 group-hover:text-gray-200 text-center leading-tight line-clamp-2">{label}</span>
  </div>
);

const CategorySection = ({ category, searchTerm, onDragStart }: any) => {
  // Default closed to keep the 320px window clean, unless searching
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  if (category.items.length === 0) return null;

  return (
    <div className="mb-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-lg transition-colors group select-none"
      >
        {isOpen ? (
          <ChevronDown size={14} className="text-gray-500 group-hover:text-gray-300" />
        ) : (
          <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300" />
        )}
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-300">
          {category.label}
        </span>
        <div className="ml-auto text-[9px] text-gray-700 font-mono group-hover:text-gray-600">
          {category.items.length}
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-4 gap-2 pl-2 mt-1 pb-2 animate-in fade-in slide-in-from-top-1 duration-200 border-l border-white/5 ml-2.5">
          {category.items.map((item: any) => (
            <DraggableMenuItem 
              key={item.type} 
              {...item} 
              onDragStart={onDragStart} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const { interactionMode, setInteractionMode, deleteSelection, isAddMenuOpen, setAddMenuOpen } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when menu opens
  useEffect(() => {
    if (isAddMenuOpen) {
        setSearchTerm(''); // Clear search on open
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 50);
    }
  }, [isAddMenuOpen]);

  const handleDragStart = () => {
    // Close the menu immediately when dragging starts.
    setTimeout(() => {
        setAddMenuOpen(false);
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
      {isAddMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setAddMenuOpen(false)}
        />
      )}

      {/* --- POPUP MENU (The Grid) --- */}
      <div 
        className={clsx(
          "absolute bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 origin-bottom",
          isAddMenuOpen 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <div 
          className="bg-[#1a1a1d]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl w-[600px] h-[320px] flex flex-col"
          onClick={(e) => e.stopPropagation()} 
        >
          
          {/* Search Bar */}
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search nodes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/30 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 placeholder-gray-600"
            />
          </div>

          {/* Categories List - Vertical & Collapsible */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
            {filteredCategories.length > 0 ? (
              <div className="flex flex-col">
                {filteredCategories.map(cat => (
                  <CategorySection 
                    key={cat.id} 
                    category={cat} 
                    searchTerm={searchTerm}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Search size={24} className="mb-2 opacity-20" />
                <span className="text-xs">No nodes found</span>
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
              active={isAddMenuOpen} 
              onClick={() => {
                const nextState = !isAddMenuOpen;
                setAddMenuOpen(nextState);
                if (nextState) {
                  setInteractionMode('select');
                }
              }} 
            />
            
            <ToolbarButton 
              icon={MousePointer2} 
              active={!isAddMenuOpen && interactionMode === 'select'} 
              onClick={() => {
                setInteractionMode('select');
                setAddMenuOpen(false);
              }} 
            />
            
            <ToolbarButton 
              icon={Hand} 
              active={!isAddMenuOpen && interactionMode === 'hand'} 
              onClick={() => {
                setInteractionMode('hand');
                setAddMenuOpen(false);
              }} 
            />
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
