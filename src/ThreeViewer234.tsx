/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import { loadFromIndexedDB} from "./indexDBServices";
import { Rhino3dmLoader } from "three/examples/jsm/Addons.js";



export default function ThreeViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    async function loadModel() {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (mountRef.current) mountRef.current.appendChild(renderer.domElement);
      document.body.appendChild(renderer.domElement);
  
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
  
      const loader = new Rhino3dmLoader();
      loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0-beta/");
      try {
        const blobs = await loadFromIndexedDB(); 
        // console.log('blob', blobs)// Load all blobs from IndexedDB
        if (blobs && blobs.length > 0) {
          for (const blobItem of blobs) {
            try {
              const blobUrl = URL.createObjectURL(blobItem.geometryBlob); // Convert blob to URL
              //console.log('blobUrl', blobUrl)

              loader.load(
                blobUrl,
                (object) => {
                  scene.add(object); // Add loaded object to the scene
                  //console.log(`3DM object added to the scene: ${blobItem.id}`);
                },
                (xhr) => {
                  console.log(`Loading ${(xhr.loaded / xhr.total) * 100}%`);
                },
                (error) => {
                  console.error("Error loading 3DM file:", error);
                }
              );
            } catch (error) {
              console.error("Error loading blob:", blobItem, error);
            }
          }
        } else {
          console.warn("No geometry data found in IndexedDB.");
        }
      } catch (error) {
        console.error("Failed to load data from IndexedDB:", error);
      }

      camera.position.set(0, 0, 10);
      const animate = function () {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        renderer.dispose();
        mountRef.current?.removeChild(renderer.domElement);
      };

    }
  
    loadModel();
  }, []);
  
  
  
  
  

  return  <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}


