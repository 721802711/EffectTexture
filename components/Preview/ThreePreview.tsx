
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { Box, Circle, Square } from 'lucide-react';
import clsx from 'clsx';

// Fix for missing JSX types: define R3F elements as variables
// This bypasses TypeScript's IntrinsicElements check which is failing to pick up augmentations
const R3F = {
  mesh: 'mesh' as any,
  boxGeometry: 'boxGeometry' as any,
  sphereGeometry: 'sphereGeometry' as any,
  planeGeometry: 'planeGeometry' as any,
  meshStandardMaterial: 'meshStandardMaterial' as any,
  color: 'color' as any
};

type GeometryType = 'box' | 'sphere' | 'plane';

const PreviewMesh = ({ type }: { type: GeometryType }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureUrl = useStore(s => s.previewTextureUrl);
  const textureLoader = useRef(new THREE.TextureLoader());
  
  // Update texture when URL changes
  useEffect(() => {
    if (meshRef.current && textureUrl) {
      textureLoader.current.load(textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        
        const mat = meshRef.current?.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
      });
    }
  }, [textureUrl]);

  useFrame((state, delta) => {
    if (meshRef.current) {
       // Slow rotation
       meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <R3F.mesh ref={meshRef} castShadow receiveShadow>
      {type === 'box' && <R3F.boxGeometry args={[2, 2, 2]} />}
      {type === 'sphere' && <R3F.sphereGeometry args={[1.5, 64, 64]} />}
      {type === 'plane' && <R3F.planeGeometry args={[3, 3]} />}
      
      <R3F.meshStandardMaterial 
        color="#ffffff" 
        roughness={0.4} 
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </R3F.mesh>
  );
};

const ThreePreview: React.FC = () => {
  const [geo, setGeo] = useState<GeometryType>('box');

  return (
    <div className="w-full h-full relative group">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <R3F.color attach="background" args={['#1a202c']} />
        
        <Stage environment="city" intensity={0.6}>
           <PreviewMesh type={geo} />
        </Stage>
        
        <OrbitControls makeDefault autoRotate={false} />
        <Environment preset="studio" />
      </Canvas>
      
      {/* Overlay info */}
      <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white backdrop-blur-sm pointer-events-none">
         <p>Interactive 3D Preview</p>
         <p className="text-gray-400">WebGL / Three.js</p>
      </div>

      {/* Geometry Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-gray-900/80 p-1 rounded-md backdrop-blur-sm border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={() => setGeo('box')}
          className={clsx("p-2 rounded hover:bg-gray-700 transition-colors", geo === 'box' ? "text-orange-500 bg-gray-800" : "text-gray-400")}
          title="Cube"
        >
          <Box size={16} />
        </button>
        <button 
          onClick={() => setGeo('sphere')}
          className={clsx("p-2 rounded hover:bg-gray-700 transition-colors", geo === 'sphere' ? "text-orange-500 bg-gray-800" : "text-gray-400")}
          title="Sphere"
        >
          <Circle size={16} />
        </button>
        <button 
          onClick={() => setGeo('plane')}
          className={clsx("p-2 rounded hover:bg-gray-700 transition-colors", geo === 'plane' ? "text-orange-500 bg-gray-800" : "text-gray-400")}
          title="Plane"
        >
          <Square size={16} />
        </button>
      </div>
    </div>
  );
};

export default ThreePreview;
