
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { CATEGORIES } from '../data/nodeCategories';
import { NodeType, TextureNode } from '../types';

const ContextMenu: React.FC = () => {
  const { contextMenu, setContextMenu, addNode } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten items for linear list searching
  const allItems = CATEGORIES.flatMap(cat => 
    cat.items.map(item => ({ ...item, category: cat.label }))
  );

  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (contextMenu) {
      setSearchTerm('');
      setSelectedIndex(0);
      // Slight delay to ensure render
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [contextMenu]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  if (!contextMenu) return null;

  const handleCreate = (item: typeof allItems[0]) => {
    const newNode: TextureNode = {
      id: `node_${item.type}_${Date.now()}`,
      type: item.type, 
      position: { x: contextMenu.flowX, y: contextMenu.flowY },
      data: { 
        label: `${item.type.charAt(0) + item.type.slice(1).toLowerCase().replace('_', ' ')}`, 
        type: item.type, 
        params: {} 
      },
    };
    addNode(newNode);
    setContextMenu(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleCreate(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setContextMenu(null);
    }
  };

  // Ensure menu doesn't go off-screen
  const menuWidth = 360; // Wider for Raycast style
  const menuHeight = 450; 
  let posX = contextMenu.x;
  let posY = contextMenu.y;

  if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 20;
  if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 20;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent" 
        onClick={() => setContextMenu(null)} 
        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
      />
      
      {/* Menu */}
      <div 
        className="fixed z-[101] bg-[#161618] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5"
        style={{ left: posX, top: posY, width: menuWidth }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Search */}
        <div className="p-3.5 border-b border-white/5 flex items-center gap-3">
           <Search size={18} className="text-gray-500" />
           <input 
             ref={inputRef}
             type="text"
             className="bg-transparent w-full text-base text-gray-100 placeholder-gray-500 focus:outline-none"
             placeholder="Search nodes..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             onKeyDown={handleKeyDown}
           />
        </div>
        
        {/* Results Header */}
        <div className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            Results
        </div>

        {/* Results List */}
        <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
           {filteredItems.length === 0 ? (
             <div className="px-4 py-8 text-sm text-gray-500 text-center">No nodes found</div>
           ) : (
             filteredItems.map((item, index) => (
               <div 
                 key={item.type + index}
                 className={clsx(
                   "px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors group",
                   index === selectedIndex ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-white/5"
                 )}
                 onClick={() => handleCreate(item)}
                 onMouseEnter={() => setSelectedIndex(index)}
               >
                 {/* Left: Icon + Label */}
                 <div className="flex items-center gap-3">
                    <item.icon 
                        size={16} 
                        className={clsx(
                            index === selectedIndex ? "text-purple-200" : "text-gray-500 group-hover:text-gray-400"
                        )} 
                    />
                    <span className="text-sm font-medium">
                        {item.label}
                    </span>
                 </div>

                 {/* Right: Category */}
                 <span className={clsx(
                    "text-[10px]",
                    index === selectedIndex ? "text-purple-200/70" : "text-gray-600 group-hover:text-gray-500"
                 )}>
                   {item.category}
                 </span>
               </div>
             ))
           )}
        </div>
        
        {/* Footer Hint */}
        <div className="bg-[#121214] px-3 py-2 border-t border-white/5 flex justify-between text-[10px] text-gray-600">
           <span>Select</span>
           <span className="font-mono">↵ to create</span>
        </div>
      </div>
    </>
  );
};

export default ContextMenu;
