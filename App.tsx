
import React, { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Sidebar from './components/Sidebar';
import GraphEditor from './components/GraphEditor';
import NodeInspector from './components/NodeInspector';
import HomeOverlay from './components/HomeOverlay';
import HelpOverlay from './components/HelpOverlay';
import Header from './components/Header';
import ContextMenu from './components/ContextMenu';

const App: React.FC = () => {
  // Optimized: Show Home Overlay by default for better initial UX
  const [isHomeOpen, setIsHomeOpen] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="flex w-screen h-screen bg-[#09090b] overflow-hidden font-sans text-gray-300 select-none">
      
      {/* --- MODULE: INSPECTOR --- */}
      <NodeInspector />

      {/* --- MODULE: CONTEXT MENU --- */}
      <ContextMenu />

      {/* --- MODULE: HOME --- */}
      <HomeOverlay isOpen={isHomeOpen} onClose={() => setIsHomeOpen(false)} />

      {/* --- MODULE: HELP --- */}
      <HelpOverlay isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 relative flex flex-col bg-[#0c0c0e]">
        
        {/* --- MODULE: HEADER --- */}
        <Header 
          onOpenHome={() => setIsHomeOpen(true)} 
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        {/* --- MODULE: CANVAS & EDITOR --- */}
        <div className="flex-1 relative pt-14 flex">
           
           {/* Graph Area */}
           <div className="flex-1 relative h-full">
             <ReactFlowProvider>
                <GraphEditor />
             </ReactFlowProvider>
             <Sidebar /> 
           </div>

        </div>
      </div>

    </div>
  );
};

export default App;
