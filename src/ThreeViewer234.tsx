/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useEffect, useRef } from "react";
import * as THREE from "three";
// import initSqlJs from "sql.js";
// import { loadCombinedData } from "./loadCombineData";
// import { MetadataItem } from "./loadCombineData";
import { OrbitControls } from "three-stdlib";
import { loadFromIndexedDB } from "./indexDBServices";
import { Rhino3dmLoader } from "three/examples/jsm/Addons.js";


// function base64ToUint8Array(base64: string): Uint8Array {
//   const binaryString = atob(base64);
//   const binaryLength = binaryString.length;
//   const bytes = new Uint8Array(binaryLength);
//   for (let i = 0; i < binaryLength; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes;
// }


// function parseGeometryData(geometryData: string) {
//   // Step 1: Decode Base64 to binary
//   const binaryData = base64ToUint8Array(geometryData);

//   // Ensure data alignment for Float32Array
//   const alignedData = alignBinaryData(binaryData);

//   // Check for minimum length (must have at least 3 vertices)
//   if (alignedData.length < 12) {
//     console.error("Insufficient data for geometry.");
//     return null;
//   }

//   // Step 2: Interpret the data
//   const positions = new Float32Array(alignedData.buffer);

//   // Create BufferGeometry
//   const geometry = new THREE.BufferGeometry();
//   geometry.setAttribute(
//     'position',
//     new THREE.BufferAttribute(positions, 3) // Assuming XYZ coordinates
//   );

//   // Optional: Compute normals if not provided
//   geometry.computeVertexNormals();

//   // Optional: Compute bounding sphere for Three.js optimizations
//   geometry.computeBoundingSphere();

//   return geometry;
// }

// function alignBinaryData(binaryData: Uint8Array): Uint8Array {
//   const alignedLength = Math.floor(binaryData.length / 4) * 4;
//   if (binaryData.length !== alignedLength) {
//     console.warn(
//       `Binary data length (${binaryData.length}) is not a multiple of 4. Trimming to ${alignedLength}.`
//     );
//     return binaryData.slice(0, alignedLength);
//   }
//   return binaryData;
// }


export default function ThreeViewer() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    async function loadModel() {
      // const SQL = await initSqlJs();
      // const dataToSave: MetadataItem[] = []; // Initialize with your data
      // const data = await loadCombinedData({ Database: SQL.Database, dataToSave });
  
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
  
      // for (const item of data) {
      //   try {
      //     if (item.geometryBlob instanceof Blob) {
      //       const blobText = await item.geometryBlob.text();
      //       const geometryData = JSON.parse(blobText);
      //       console.log("Parsed Geometry Data:", geometryData);
    
      //       const geometry = parseGeometryData(geometryData.data);

            
      //       if (!geometry) {
      //         console.warn("Skipping invalid geometry:", item);
      //         continue;
      //       }
    
    
      //       const material = new THREE.MeshStandardMaterial({
      //         color: 0xffffff,
      //         side: THREE.DoubleSide,
      //       });
    
      //       const mesh = new THREE.Mesh(geometry, material);
      //       scene.add(mesh);
      //       console.log("Mesh added to scene:", mesh);

            
      //     } else {
      //       console.warn("Invalid Blob data for item:", item);
      //     }
      //   } catch (error) {
      //     console.error("Failed to process item:", item, error);
      //   }
      // }
      const loader = new Rhino3dmLoader();
      loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0-beta/");
      try {
        const blobs = await loadFromIndexedDB(); 
        // console.log('blob', blobs)// Load all blobs from IndexedDB
        if (blobs && blobs.length > 0) {
          for (const blobItem of blobs) {
            // try {
            //   const blobText = await blobItem.geometryBlob.text(); // Assuming the blob contains JSON data
            //   const geometryData = JSON.parse(blobText);

            //   console.log('geometryData', geometryData)
            //   // Parse geometry into Three.js format
            //   const loader = new THREE.BufferGeometryLoader();
            //   const geometry = loader.parse(geometryData);
            //   geometry.computeVertexNormals();
            //   geometry.computeBoundingSphere();

            //   // Add metadata (e.g., visibility, name)
            //   const material = new THREE.MeshStandardMaterial({
            //     color: 0xffffff,
            //     side: THREE.DoubleSide,
            //   });

            //   const mesh = new THREE.Mesh(geometry, material);

            //   mesh.name = blobItem.id; // Assign the ID for querying
            //   mesh.visible = true; // Default to visible; use metadata for visibility

            //   scene.add(mesh); // Add each geometry as a separate mesh
            //   console.log("Added geometry to scene:", blobItem.id);
            // } catch (error) {
            //   console.error("Failed to load geometry blob:", blobItem, error);
            // }
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


