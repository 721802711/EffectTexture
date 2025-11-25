import { Node, Edge } from 'reactflow';
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
      mesh: any;
      boxGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      meshStandardMaterial: any;
      color: any;
    }
  }
}

export enum NodeType {
  // Generators
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  POLYGON = 'POLYGON',
  WAVY_RING = 'WAVY_RING',
  BEAM = 'BEAM',
  
  // Inputs
  COLOR = 'COLOR',
  VALUE = 'VALUE',

  // Math
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  
  // Filters
  FILL = 'FILL',
  GLOW = 'GLOW', // Renamed label to "Hard Glow" in UI, kept enum for compatibility
  NEON = 'NEON', // New Sharp Outer Glow
  SOFT_BLUR = 'SOFT_BLUR',
  STROKE = 'STROKE',
  GRADIENT_FADE = 'GRADIENT_FADE',
  
  // Transforms
  TRANSLATE = 'TRANSLATE',
  ROTATE = 'ROTATE',
  SCALE = 'SCALE',
  
  // Output
  OUTPUT = 'OUTPUT'
}

export interface NodeData {
  label: string;
  type: NodeType;
  params: Record<string, any>;
  onUpdate?: (id: string, params: Record<string, any>) => void;
  previewUrl?: string; 
}

export type TextureNode = Node<NodeData>;
export type TextureEdge = Edge;

export interface TextureProject {
  name?: string; 
  resolution: number; 
  nodes: TextureNode[];
  edges: TextureEdge[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  previewImage?: string; // Base64 Data URL for thumbnail
  data: TextureProject;
}