/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ThreeScene.tsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import { loadDatabase,  saveDatabase  } from './indexDB';
import { Database } from './types';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;

    const light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    const loadModel = async () => {
        const db = await loadDatabase();
        const modelData = await fetchModelData('/bugatti.obj');
        await storeModelData(db, '/bugatti.obj', modelData);
        const object = await loadModelFromCache(db, '/bugatti.obj');
        console.log('Loaded model:', object);
        scene.add(object);
    };

    async function fetchModelData(url: string): Promise<ArrayBuffer> {
        const response = await fetch(url);
        return response.arrayBuffer();
      }
      
      async function storeModelData(db: Database, modelName: string, modelData: ArrayBuffer): Promise<void> {
        db.run('CREATE TABLE IF NOT EXISTS models (name TEXT PRIMARY KEY, data BLOB)');
        const stmt: any = db.prepare('INSERT OR REPLACE INTO models (name, data) VALUES (?, ?)');
        stmt.run([modelName, new Uint8Array(modelData)]);
        stmt.free();
        await saveDatabase(db);
      }
      
      async function loadModelFromCache(db: Database, modelName: string): Promise<THREE.Group> {
        const stmt: any = db.prepare('SELECT data FROM models WHERE name = ?');
        stmt.bind([modelName]);
        let object = new THREE.Group();
        if (stmt.step()) {
          const result = stmt.getAsObject();
          const arrayBuffer = result.data as Uint8Array;
          const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const loader = new OBJLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(
              url,
              (obj) => {
                resolve(obj);
                URL.revokeObjectURL(url);
              },
              undefined,
              (error) => {
                reject(error);
              }
            );
          });
        }
        stmt.free();
        return object;
      }

    loadModel();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default ThreeScene;
