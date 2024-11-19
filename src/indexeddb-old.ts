// src/indexedDB.ts

const DB_NAME = 'myDatabase';
const DB_VERSION = 1;
const STORE_NAME = 'myStore';

// Open or create IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};



interface Item {
  id?: number;
  value: string;
}

// src/indexedDB.ts

export const getItems = async (startIndex: number = 0, limit: number = 100): Promise<Item[]> => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.openCursor();

  const results: Item[] = [];
  let count = 0;

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        // Skip items until reaching startIndex
        if (count >= startIndex && results.length < limit) {
          results.push(cursor.value as Item);
        }
        count++;
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => {
      console.error("Failed to retrieve items from IndexedDB:", request.error);
      reject(request.error);
    };
  });
};

export const stressTestAddItems = async (numItems: number, dataSize: number, batchSize: number = 100) => {
  const db = await openDB();
  const retryLimit = 3;

  for (let i = 0; i < numItems; i += batchSize) {
    let attempt = 0;
    let success = false;
    console.log(`Processing batch starting at index ${i}`);

    while (attempt < retryLimit && !success) {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      try {
        for (let j = i; j < i + batchSize && j < numItems; j++) {
          const data = {
            value: 'x'.repeat(dataSize), // Creates a string of 'dataSize' characters
          };
          store.add(data);
        }

        await new Promise<void>((resolve, reject) => {
          transaction.oncomplete = () => {
            console.log(`Batch starting at index ${i} completed successfully`);
            success = true;
            resolve();
          };
          transaction.onerror = (event) => {
            console.error("Transaction error:", event);
            reject(transaction.error);
          };
        });
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} for batch starting at index ${i} failed with error:`, error);
        if (attempt >= retryLimit) throw error;
      }
    }
  }
};


// Function to load a single JSON object into IndexedDB
export const loadJSONToIndexedDB = async (jsonData: Record<string, unknown>) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  // Add the JSON object directly
  await store.add(jsonData);

  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};




  
  
  
  
