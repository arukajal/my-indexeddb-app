/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { Rhino3dmLoader } from "three/examples/jsm/loaders/3DMLoader.js";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<any>(null);

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

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const clearScene = (scene: THREE.Scene) => {
    while (scene.children.length > 0) {
      const child = scene.children[0];
      if (!(child instanceof THREE.Light)) {
        scene.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
  };

  const processRhinoDoc = async (doc: any) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!scene || !camera || !controls) return;

    clearScene(scene);

    console.log("Processing Rhino document");
    for (let i = 0; i < doc.objects().count; i++) {
      const obj = doc.objects().get(i);
      if (!obj) continue;

      const geometry = obj.geometry();
      const loader = new Rhino3dmLoader();
      loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/");

      const buffer = geometry.encode();
      loader.parse(
        buffer,
        (threeObject: any) => {
          if (threeObject) {
            scene.add(threeObject);

            const box = new THREE.Box3().setFromObject(threeObject);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            camera.position.set(center.x, center.y, cameraZ * 2);
            camera.lookAt(center);

            controls.target.set(center.x, center.y, center.z);
            controls.update();
          }
        },
        (error: any) => {
          console.error("Failed to parse Rhino object:", error);
        }
      );
    }

    console.log("Completed processing Rhino document");
  };

  const processBREPData = async (jsonData: any) => {
    const rhino = await (window as any).rhino3dm();
    console.log("Rhino3dm loaded successfully");

    const doc = new rhino.File3dm();

    jsonData.values.forEach((item: any) => {
      Object.values(item.InnerTree).forEach((entries: any) => {
        entries.forEach((entry: any, index: number) => {
          try {
            const parsedEntry = JSON.parse(entry.data);

            if (entry.type === "Rhino.Geometry.Brep") {
              let buffer;
              try {
                buffer = Uint8Array.from(
                  atob(parsedEntry.data),
                  (c) => c.charCodeAt(0)
                );
              } catch (error: any) {
                console.error(`Error decoding base64 at index ${index}:`, error.message);
                return;
              }

              try {
                const brep = rhino.CommonObject.decode(buffer);
                if (brep && brep.isValid) {
                  doc.objects().add(brep);
                  console.log(`BREP added at index ${index}`);
                } else {
                  console.warn(`Invalid or unsupported BREP at index ${index}`);
                }
              } catch (error: any) {
                console.error(`Error decoding BREP at index ${index}:`, error.message);
              }
            }
          } catch (error: any) {
            console.error(`Error processing data at index ${index}:`, error.message);
          }
        });
      });
    });

    console.log(`Successfully added ${doc.objects().count} BREP(s) to the document`);
    return doc;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        console.log("Uploaded JSON data:", jsonData);
        const doc = await processBREPData(jsonData);

        if (doc.objects().count === 0) {
          console.error("No valid BREP objects found in the file.");
          return;
        }

        await processRhinoDoc(doc);
      } catch (error) {
        console.error("Error processing uploaded file:", error);
      }
    };
    reader.readAsText(files[0]);
  };

  return (
    <div>
      <h1>3D Model Viewer</h1>
      <label htmlFor="file-upload">Upload JSON File with BREPs:</label>
      <input id="file-upload" type="file" onChange={handleFileUpload} />
      <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}
