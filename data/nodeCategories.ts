
import { 
  Palette, 
  Layers,
  Plus,
  Minus,
  Percent,
  X as MultiplyIcon,
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
  Zap,
  Ghost,
  Image as ImageIcon,
  Pipette,
  Globe,
  Grid,
  Spline,
  Edit3,
  ScanLine
} from 'lucide-react';
import { NodeType } from '../types';

export const CATEGORIES = [
  {
    id: 'shapes',
    label: 'Shapes',
    items: [
      { label: 'Rectangle', icon: Square, type: NodeType.RECTANGLE },
      { label: 'Circle', icon: Circle, type: NodeType.CIRCLE },
      { label: 'Polygon', icon: Hexagon, type: NodeType.POLYGON },
      { label: 'Wavy Ring', icon: Waves, type: NodeType.WAVY_RING },
      { label: 'Beam', icon: Flashlight, type: NodeType.BEAM },
    ]
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { label: 'Pen Tool', icon: PenTool, type: NodeType.PEN },
      { label: 'Trace (Bmp->Vec)', icon: ScanLine, type: NodeType.TRACE },
      { label: 'Custom Path', icon: Spline, type: NodeType.PATH },
    ]
  },
  {
    id: 'inputs',
    label: 'Inputs',
    items: [
      { label: 'Color', icon: Palette, type: NodeType.COLOR },
      { label: 'Gradient', icon: Pipette, type: NodeType.GRADIENT },
      { label: 'Image', icon: ImageIcon, type: NodeType.IMAGE },
      { label: 'Value', icon: Layers, type: NodeType.VALUE },
      { label: 'Alpha', icon: Ghost, type: NodeType.ALPHA },
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
  },
  {
    id: 'style',
    label: 'Style',
    items: [
      { label: 'Fill', icon: PaintBucket, type: NodeType.FILL },
      { label: 'Stroke', icon: Edit3, type: NodeType.STROKE },
      { label: 'Fade', icon: Blend, type: NodeType.GRADIENT_FADE },
    ]
  },
  {
    id: 'effects',
    label: 'Effects',
    items: [
      { label: 'Hard Glow', icon: Sparkles, type: NodeType.GLOW },
      { label: 'Neon', icon: Zap, type: NodeType.NEON },
      { label: 'Soft Blur', icon: Droplets, type: NodeType.SOFT_BLUR },
      { label: 'Pixelate', icon: Grid, type: NodeType.PIXELATE },
    ]
  },
  {
    id: 'transforms',
    label: 'Transforms',
    items: [
      { label: 'Move', icon: Move, type: NodeType.TRANSLATE },
      { label: 'Rotate', icon: RotateCw, type: NodeType.ROTATE },
      { label: 'Scale', icon: Maximize, type: NodeType.SCALE },
      { label: 'Polar Coords', icon: Globe, type: NodeType.POLAR },
    ]
  }
];
