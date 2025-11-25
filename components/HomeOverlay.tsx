
import React, { useState, useRef, useEffect } from 'react';
import { FileCode2, LayoutTemplate, FolderOpen, Plus, X, ChevronRight, FileJson, Download, Upload, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store';
import { DEFAULT_TEMPLATES } from '../data/templates';
import { TextureProject } from '../types';

interface HomeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const HomeOverlay: React.FC<HomeOverlayProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'projects'>('templates');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { loadProject, nodes, edges, projectName, templates, deleteTemplate } = useStore();

  // Reset to templates tab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab('templates');
    }
  }, [isOpen]);

  const handleApplyTemplate = (templateData: TextureProject, name: string) => {
    loadProject({
      ...templateData,
      name: name
    });
    onClose();
  };

  const handleExportJSON = () => {
    const projectData: TextureProject = {
      name: projectName,
      resolution: 512,
      nodes,
      edges
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAnchorNode.setAttribute("download", `${safeName}_graph.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.nodes && json.edges) {
          loadProject(json as TextureProject);
          onClose();
        } else {
          alert("Invalid project file structure.");
        }
      } catch (error) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handleDeleteTemplate = (id: string) => {
      if (window.confirm("Are you sure you want to delete this template?")) {
          deleteTemplate(id);
      }
  };

  return (
    <div className={clsx(
      "fixed inset-0 z-[100] bg-[#09090b]/95 backdrop-blur-xl transition-all duration-300 flex items-center justify-center",
      isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
    )}>
      <div className="w-[800px] h-[550px] bg-[#1a1a1d] border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* Home Sidebar */}
        <div className="w-64 bg-black/20 border-r border-white/5 p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 mb-4 text-white">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <FileCode2 size={18} />
            </div>
            <span className="font-bold tracking-tight">TextureLab</span>
          </div>
          
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('templates')}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'templates' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <LayoutTemplate size={16} className={activeTab === 'templates' ? "text-purple-400" : ""} />
              Templates
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === 'projects' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <FolderOpen size={16} className={activeTab === 'projects' ? "text-purple-400" : ""} />
              Projects
            </button>
          </nav>

          <div className="mt-auto">
             <button 
              onClick={() => handleApplyTemplate(DEFAULT_TEMPLATES.find(t => t.id === 'empty')!.data, 'New Project')}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
             >
               <Plus size={16} /> New Empty
             </button>
          </div>
        </div>

        {/* Home Content */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#1a1a1d]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {activeTab === 'templates' ? 'Start with a Template' : 'Manage Projects'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* TAB: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="grid gap-3">
              {templates.length === 0 ? (
                <div className="text-gray-500 text-center py-10 text-sm">No templates found.</div>
              ) : (
                templates.map((tpl) => (
                  <div 
                    key={tpl.id} 
                    className="group relative bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] rounded-xl transition-all overflow-hidden"
                  >
                      {/* 1. Background Click Target (Loads Template) */}
                      <div 
                        className="absolute inset-0 z-0 cursor-pointer"
                        onClick={() => handleApplyTemplate(tpl.data, tpl.name)}
                      />
  
                      {/* 2. Content Layer */}
                      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
                          
                          <div className="flex items-center gap-4">
                            {/* Thumbnail or Icon */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center overflow-hidden relative">
                              {tpl.previewImage ? (
                                <img src={tpl.previewImage} alt={tpl.name} className="w-full h-full object-cover" />
                              ) : (
                                <LayoutTemplate className="text-gray-500 group-hover:text-purple-400 transition-colors" size={20} />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-200 group-hover:text-purple-400 transition-colors">{tpl.name}</h3>
                              <p className="text-xs text-gray-500">{tpl.description}</p>
                            </div>
                          </div>
                          
                          {/* Actions (Pointer Events Auto to capture clicks) */}
                          <div className="flex items-center gap-2 pointer-events-auto z-20">
                               {/* Delete Button - Using onPointerDown to act immediately before drag/click propagation */}
                               {tpl.id !== 'empty' && (
                                   <button 
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteTemplate(tpl.id);
                                      }}
                                      className="p-2 rounded-full text-gray-600 hover:bg-red-500/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                      title="Delete Template"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                               )}
                               <ChevronRight size={16} className="text-gray-600 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />
                          </div>
                      </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="flex flex-col gap-4">
              <div className="p-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center gap-4 text-center">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-purple-400">
                    <FileJson size={32} />
                 </div>
                 <div>
                   <h3 className="text-gray-200 font-medium">Local JSON Files</h3>
                   <p className="text-sm text-gray-500 mt-1 max-w-xs">Save your current graph to a local JSON file or load one back.</p>
                 </div>
                 
                 <div className="flex gap-3 mt-2">
                   <button 
                     onClick={handleExportJSON}
                     className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/5 rounded-lg text-sm text-white transition-colors"
                    >
                     <Download size={16} /> Save to Disk
                   </button>
                   
                   <button 
                     onClick={handleImportClick}
                     className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm text-white transition-colors"
                    >
                     <Upload size={16} /> Open from Disk
                   </button>
                   {/* Hidden File Input */}
                   <input 
                     type="file" 
                     accept=".json" 
                     ref={fileInputRef} 
                     className="hidden" 
                     onChange={handleFileChange}
                   />
                 </div>
              </div>
              
              <div className="text-xs text-gray-600 text-center mt-4">
                Note: This saves the raw node configuration. Generated textures are re-rendered upon loading.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HomeOverlay;
