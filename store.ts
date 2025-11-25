
import { create } from 'zustand';
import { 
  Connection, 
  EdgeChange, 
  NodeChange, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Node
} from 'reactflow';
import { TextureNode, TextureEdge, TextureProject, Template } from './types';
import { INITIAL_NODES, INITIAL_EDGES, PREVIEW_RES } from './constants';
import { generateTextureGraph, generateTexturePNG } from './services/graphCompiler';
import { DEFAULT_TEMPLATES } from './data/templates';

type InteractionMode = 'select' | 'hand';

interface AppState {
  projectName: string;
  nodes: TextureNode[];
  edges: TextureEdge[];
  previewTextureUrl: string | null;
  interactionMode: InteractionMode;
  editingNodeId: string | null;
  inspectorPosition: { x: number; y: number } | null;
  templates: Template[];
  
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: TextureNode) => void;
  updateNodeParams: (id: string, params: Record<string, any>) => void;
  triggerRender: () => void;
  setInteractionMode: (mode: InteractionMode) => void;
  loadProject: (project: TextureProject) => void;
  setProjectName: (name: string) => void;
  setEditingNodeId: (id: string | null, position?: { x: number; y: number }) => void;
  saveProjectAsTemplate: () => Promise<void>;
  deleteTemplate: (id: string) => void;
  deleteSelection: () => void;
}

let renderDebounceTimer: any = null;
const USER_TEMPLATES_KEY = 'texture-lab-user-templates_v2';

// Helper: Load ONLY user created templates from storage
const loadUserTemplates = (): Template[] => {
  try {
    const stored = localStorage.getItem(USER_TEMPLATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load user templates", e);
  }
  return [];
};

export const useStore = create<AppState>((set, get) => ({
  projectName: 'Untitled Project',
  nodes: INITIAL_NODES,
  edges: INITIAL_EDGES,
  previewTextureUrl: null,
  interactionMode: 'select',
  editingNodeId: null,
  inspectorPosition: null,
  
  // Initialize: Combine User Templates (first) + Default Templates (last)
  templates: [...loadUserTemplates(), ...DEFAULT_TEMPLATES],

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as TextureNode[],
    });
    
    const hasRemoved = changes.some(c => c.type === 'remove');
    if (hasRemoved) {
      get().triggerRender();
    }
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    get().triggerRender();
  },

  onConnect: (connection) => {
    const { edges } = get();
    const cleanEdges = edges.filter(e => 
      !(e.target === connection.target && e.targetHandle === connection.targetHandle)
    );

    set({
      edges: addEdge(connection, cleanEdges),
    });
    get().triggerRender();
  },

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
    get().triggerRender();
  },

  updateNodeParams: (id, newParams) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              params: { ...node.data.params, ...newParams },
            },
          };
        }
        return node;
      }),
    });
    
    if (renderDebounceTimer) {
        clearTimeout(renderDebounceTimer);
    }
    renderDebounceTimer = setTimeout(() => {
        get().triggerRender();
    }, 10);
  },

  triggerRender: async () => {
    const { nodes, edges } = get();
    const url = await generateTextureGraph(nodes, edges, PREVIEW_RES);
    set({ previewTextureUrl: url });
  },

  setInteractionMode: (mode) => set({ interactionMode: mode }),

  loadProject: (project) => {
    set({
      projectName: project.name || 'Imported Project',
      nodes: project.nodes,
      edges: project.edges,
    });
    get().triggerRender();
  },

  setProjectName: (name) => set({ projectName: name }),
  
  setEditingNodeId: (id, position) => set({ editingNodeId: id, inspectorPosition: position || null }),

  saveProjectAsTemplate: async () => {
    const { projectName, nodes, edges } = get();
    
    // 1. Generate very small thumbnail (64px) to save localStorage space
    let thumbnail = undefined;
    try {
        thumbnail = await generateTexturePNG(nodes, edges, 64);
    } catch (e) {
        console.warn("Failed to generate thumbnail", e);
    }

    const newTemplate: Template = {
      id: `tpl-${Date.now()}`,
      name: projectName,
      description: `Saved on ${new Date().toLocaleDateString()}`,
      previewImage: thumbnail,
      data: {
        name: projectName,
        resolution: 512,
        nodes: [...nodes],
        edges: [...edges]
      }
    };
    
    // 2. Add to User Templates List and Persist
    const currentUserTemplates = loadUserTemplates();
    const updatedUserTemplates = [newTemplate, ...currentUserTemplates];
    
    try {
        localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(updatedUserTemplates));
    } catch (e) {
        console.error("Storage full", e);
        alert("Could not save template: Storage full.");
        return;
    }

    // 3. Update State (Merge User + Default)
    set({ templates: [...updatedUserTemplates, ...DEFAULT_TEMPLATES] });
  },

  deleteTemplate: (id: string) => {
      const { templates } = get();
      
      // Update State
      const newAllTemplates = templates.filter(t => t.id !== id);
      set({ templates: newAllTemplates });
      
      // Update Storage (Filter out defaults first to only save user templates)
      // We identify defaults by checking if they exist in DEFAULT_TEMPLATES
      const isDefault = (tid: string) => DEFAULT_TEMPLATES.some(dt => dt.id === tid);
      
      const newUserTemplates = newAllTemplates.filter(t => !isDefault(t.id));
      
      try {
          localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(newUserTemplates));
      } catch (e) {
          console.error("Failed to update storage", e);
      }
  },

  deleteSelection: () => {
    const { nodes, edges, onNodesChange, onEdgesChange, editingNodeId, setEditingNodeId } = get();
    
    const selectedNodes = nodes.filter(n => n.selected);
    const selectedEdges = edges.filter(e => e.selected);

    if (editingNodeId && selectedNodes.find(n => n.id === editingNodeId)) {
        setEditingNodeId(null);
    }

    if (selectedNodes.length > 0) {
        onNodesChange(selectedNodes.map(n => ({ type: 'remove', id: n.id })));
    }
    
    if (selectedEdges.length > 0) {
        onEdgesChange(selectedEdges.map(e => ({ type: 'remove', id: e.id })));
    }
  }
}));
