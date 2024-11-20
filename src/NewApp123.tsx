/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { saveModelBlobToIndexedDB, loadModelBlobFromIndexedDB, calculateHash } from "./indexDBServices";
import { Rhino3dmLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    function fitCameraToObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D, controls?: any) {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

      camera.position.set(center.x, center.y, cameraZ * 2);
      camera.lookAt(center);

      if (controls) {
        controls.target.set(center.x, center.y, center.z);
        controls.update();
      }
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    async function load3dmFileFromIndexedDB(projectId: string) {
      const { blob } = await loadModelBlobFromIndexedDB(projectId);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);

        const loader = new Rhino3dmLoader();
        loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0-beta/");
        loader.load(blobUrl, (object) => {
          scene.add(object);
          fitCameraToObject(camera, object, controls);
        });
      } else {
        console.warn("No model blob found in IndexedDB.");
      }
    }

    async function loadAndStoreModel() {
      try {
        const projectId = "project-123";
        const response = await fetch("/building.3dm");
        const modelBuffer = await response.arrayBuffer();

        const remoteHash = await calculateHash(modelBuffer);
        const { blob: localBlob, hash: localHash } = await loadModelBlobFromIndexedDB(projectId);

        if (localHash === remoteHash && localBlob) {
          console.log("Hashes match. Loading local file...");
          await load3dmFileFromIndexedDB(projectId);
        } else {
          console.log("Hashes do not match. Fetching and storing the new file...");
          const blob = new Blob([modelBuffer], { type: "application/octet-stream" });

          await saveModelBlobToIndexedDB(projectId, blob, remoteHash);
          await load3dmFileFromIndexedDB(projectId);
        }
      } catch (error) {
        console.error("Error loading and storing model:", error);
      }
    }

    loadAndStoreModel();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div>
      <h1>3D Model Viewer</h1>
      <div ref={mountRef} />
    </div>
  );
}
