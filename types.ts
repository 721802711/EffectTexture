
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
  GRADIENT = 'GRADIENT', 
  
  // Inputs
  COLOR = 'COLOR',
  VALUE = 'VALUE',
  ALPHA = 'ALPHA', 
  IMAGE = 'IMAGE',

  // Math
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  
  // Filters
  FILL = 'FILL',
  GLOW = 'GLOW', 
  NEON = 'NEON', 
  SOFT_BLUR = 'SOFT_BLUR',
  STROKE = 'STROKE',
  GRADIENT_FADE = 'GRADIENT_FADE',
  PIXELATE = 'PIXELATE', // New Rasterize/Pixelate Node
  
  // Transforms
  TRANSLATE = 'TRANSLATE',
  ROTATE = 'ROTATE',
  SCALE = 'SCALE',
  POLAR = 'POLAR', 
  
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
