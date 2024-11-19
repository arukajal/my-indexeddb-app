import { openDB } from "idb";
import { calculateHash } from "./extractModelData";

async function initDatabase() {
  const db = await openDB("modelDatabase", 5, {
    upgrade(db, oldVersion, newVersion) {
      console.log("Upgrading IndexedDB...", { oldVersion, newVersion });

      // Create "geometry" object store if it doesn't exist
      if (!db.objectStoreNames.contains("geometry")) {
        const store = db.createObjectStore("geometry", { keyPath: "id" });
        store.createIndex("hash", "hash", { unique: false });
        console.log('"geometry" object store created.');
      }
    },
  });

  console.log("Database initialized:", db);
  return db;
}

async function main() {
  await initDatabase();
  console.log("Application started...");
}

main();


export async function saveToIndexedDB(data: { id: string; geometryBlob: Blob; hash: string }[]) {
  const db = await openDB("modelDatabase", 5);

  try {
    console.log("Data being saved to IndexedDB:", data);
    const tx = db.transaction("geometry", "readwrite");
    const store = tx.objectStore("geometry");

    for (const item of data) {
      await store.put(item);
    }

    await tx.done;
    console.log("Data successfully saved to IndexedDB");
  } catch (error) {
    console.error("Error saving to IndexedDB:", error);
  }
}



export async function loadFromIndexedDB() {
  const db = await openDB("modelDatabase", 5);

  try {
    const allData = await db.getAll("geometry"); // Get all data from the store
    console.log("Retrieved data from IndexedDB:", allData);
    return allData;
  } catch (error) {
    console.error("Error loading data from IndexedDB:", error);
    return [];
  }
}



export async function checkAndUpdateFile(
    projectId: string,
    remoteFileUrl: string
  ): Promise<{ useLocal: boolean; localBlob?: Blob; updatedBlob?: Blob }> {
    const db = await openDB("modelDatabase", 5);
  
    // Fetch the remote file and calculate its hash
    const response = await fetch(remoteFileUrl);
    const remoteBuffer = await response.arrayBuffer();
    const remoteHash = await calculateHash(remoteBuffer);
  
    // Check if the project ID exists in IndexedDB
    const record = await db.get("geometry", projectId);
  
    if (record) {
      if (record.hash === remoteHash) {
        console.log("Hashes match. Using local file.");
        return { useLocal: true, localBlob: record.geometryBlob };
      } else {
        console.log("Hashes do not match. Updating local file.");
        const updatedBlob = new Blob([remoteBuffer]);
        await saveToIndexedDB([{ id: projectId, geometryBlob: updatedBlob, hash: remoteHash }]);
        return { useLocal: false, updatedBlob };
      }
    } else {
      console.log("No existing record found. Saving new file.");
      const newBlob = new Blob([remoteBuffer]);
      await saveToIndexedDB([{ id: projectId, geometryBlob: newBlob, hash: remoteHash }]);
      return { useLocal: false, updatedBlob: newBlob };
    }
  }
  
  