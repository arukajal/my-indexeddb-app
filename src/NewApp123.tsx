/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/App.tsx
import React, { useEffect } from "react";
import { extractModelData } from "./extractModelData";
import { saveToIndexedDB, checkAndUpdateFile } from "./indexDBServices";
import { saveToSQLite } from "./sqliteService";
import ThreeViewer from "./ThreeViewer234";
import { Rhino3dmLoader } from "three/examples/jsm/Addons.js";
import * as THREE from "three";

export default function App() {
  useEffect(() => {
    function load3dmFile(fileUrl: string) {
      const loader = new Rhino3dmLoader();
      loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@8.9.0-beta/");
      const scene = new THREE.Scene();
      loader.load(fileUrl, (object) => {
        scene.add(object);
        console.log("3dm file loaded:", object);
      });
    }

    async function loadAndStoreModel() {
      try {
        const projectId = "project-123";
        const response = await fetch("/Export1.3dm");
        const modelBuffer = await response.arrayBuffer();

        const { useLocal, localBlob, updatedBlob }: any = await checkAndUpdateFile(projectId, "/Export1.3dm");

        if (useLocal) {
          console.log("Loading local file...");
          const localUrl = URL.createObjectURL(localBlob);
          load3dmFile(localUrl);
        } else {
          console.log("Loading updated file...");
          const updatedUrl = URL.createObjectURL(updatedBlob);
          load3dmFile(updatedUrl);
        }

        const { indexedDBData, sqliteData } = await extractModelData(modelBuffer);

        await saveToIndexedDB(indexedDBData);
        await saveToSQLite(sqliteData);
      } catch (error) {
        console.error("Error loading and storing model:", error);
      }
    }

    loadAndStoreModel();
  }, []);

  return (
    <div>
      <h1>3D Model Viewer</h1>
      <ThreeViewer />
    </div>
  );
}

