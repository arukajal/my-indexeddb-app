// src/ThreeViewer.tsx
import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { MeshData } from './types';

interface ViewerProps {
  data: MeshData[];
}

const ThreeViewer: React.FC<ViewerProps> = ({ data }) => {
  const { scene } = useThree();
  const loader = React.useMemo(() => new OBJLoader(), []);

  useEffect(() => {
    data.forEach((meshData) => {
      const decodedData = atob(meshData.mesh_obj_base64);
      const blob = new Blob([decodedData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      loader.load(
        url,
        (object) => {
            const boundingBox = new THREE.Box3().setFromObject(object);
            const center = boundingBox.getCenter(new THREE.Vector3());
  
            // Offset the object by the center to place it at the origin
            object.position.sub(center);

          const color = Math.floor(Math.random() * 16777215);
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                child.material.color.setHex(color);
                }
            });

          scene.add(object);
        },
        undefined,
        (error) => console.error('Error loading OBJ:', error)
      );

      return () => URL.revokeObjectURL(url); // Cleanup the URL
    });
  }, [data, loader, scene]);

  return null;
};

const ViewerCanvas: React.FC<ViewerProps> = ({ data }) => (
  <Canvas
//   gl={{ alpha: false }} // Disable alpha to ensure background color is solid
  style={{ background: '#ffffff' }} // Set background color to white
  >
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <OrbitControls />
    <ThreeViewer data={data} />
  </Canvas>
);

export default ViewerCanvas;
