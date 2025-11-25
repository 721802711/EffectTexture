
import React, { useState } from 'react';
import { Home, Save, Check } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';

interface HeaderProps {
  onOpenHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenHome }) => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const { projectName, setProjectName, saveProjectAsTemplate } = useStore();

  const handleSaveTemplate = async () => {
    await saveProjectAsTemplate();
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  return (
    <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-[#0c0c0e]/50 backdrop-blur-md z-10 absolute top-0 left-0 right-0 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4">
         {/* Home Button */}
         <button 
           onClick={onOpenHome}
           className="p-2 -ml-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
         >
           <Home size={18} />
         </button>

         <div className="flex items-center group">
            <span 
              onClick={onOpenHome}
              className="text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors cursor-pointer select-none"
            >
              Home
            </span>
            <span className="mx-2 text-gray-600">/</span>
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-200 placeholder-gray-600 focus:outline-none focus:bg-white/5 focus:ring-1 focus:ring-purple-500/50 rounded px-2 -ml-2 w-48 transition-all hover:bg-white/[0.02]"
            />
         </div>
      </div>
      <div className="flex gap-2 pointer-events-auto items-center">
         {/* SAVE BUTTON */}
         <button 
           onClick={handleSaveTemplate}
           disabled={saveStatus === 'saved'}
           className={clsx(
             "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all shadow-lg",
             saveStatus === 'saved' 
               ? "bg-green-600 hover:bg-green-500 shadow-green-900/20" 
               : "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20"
           )}
           title="Save current project as a template"
         >
           {saveStatus === 'saved' ? <Check size={14} /> : <Save size={14} />}
           <span>{saveStatus === 'saved' ? 'Saved!' : 'Save'}</span>
         </button>

         <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-medium text-gray-400 border border-white/5 ml-2">
            v1.2.0
         </div>
      </div>
    </div>
  );
};

export default Header;
