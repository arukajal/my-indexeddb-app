import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { Rhino3dmLoader } from "three/examples/jsm/loaders/3DMLoader.js";
import rhino3dm from "https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/rhino3dm.module.js";

const Viewer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadBrepAndSaveTo3dm() {
      try {
        const rhino = await rhino3dm();
        const rhinoFile = await new rhino.File3dm();

        // Fetch the JSON file that contains the encoded 3dm data
        const response = await fetch("/test_brep.json");
        const fileData = await response.json();
        const fileDataJsonString = JSON.stringify(fileData);
        const brepData = await rhino.CommonObject.decode(fileDataJsonString);
        await rhinoFile.objects().add(brepData);


        // Validate JSON structure
        if (typeof fileData !== "object" || Array.isArray(fileData)) {
          throw new Error("Invalid data format. Expected an object.");
        }

        if (typeof fileData.data !== "string") {
          throw new Error("Missing or invalid 'data' field in JSON.");
        }

        // Convert Base64 to Uint8Array
        function base64ToUint8Array(base64: string) {
          const binaryString = atob(base64);
          const length = binaryString.length;
          const bytes = new Uint8Array(length);
          for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        }

        const byteArray = base64ToUint8Array(fileData.data);

        // Instead of CommonObject.decode, use File3dm.fromByteArray
        const doc = rhino.File3dm.fromByteArray(byteArray);
        if (!doc) {
          throw new Error("Failed to parse 3dm file from byte array.");
        }

        // Now we can extract any Breps from the doc
        const objects = doc.objects();
        let brep = null;
        for (let i = 0; i < objects.count; i++) {
          const obj = objects.get(i);
          const geom = obj.geometry();
          if (geom instanceof rhino.Brep) {
            brep = geom;
            break;
          }
        }

        if (!brep) {
          throw new Error("No Brep found in the 3dm file.");
        }

        // If you want to export this as a new 3dm:
        const newDoc = new rhino.File3dm();
        const attributes = new rhino.ObjectAttributes();
        attributes.name = "Converted Brep";
        newDoc.objects().add(brep, attributes);

        const fileName = "converted_brep.3dm";
        const link = document.createElement("a");
        link.href = URL.createObjectURL(
          new Blob([newDoc.toByteArray()], { type: "application/octet-stream" })
        );
        link.download = fileName;
        link.click();
        console.log(`3DM file saved as: ${fileName}`);

        // Load this new 3dm file into Three.js scene
        const loader = new Rhino3dmLoader();
        loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0/");
        loader.load(link.href, (object) => {
          console.log("3DM object loaded:", object);
          scene.add(object);
        });

        newDoc.delete();
        doc.delete();
      } catch (error) {
        console.error("Error during Brep processing:", error);
      }
    }

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Add a light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10).normalize();
    scene.add(light);

    // Position the camera
    camera.position.z = 10;

    // Load and convert the Brep JSON, save as 3DM, then load it into the scene
    loadBrepAndSaveTo3dm().catch(console.error);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup on unmount
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

export default Viewer;
