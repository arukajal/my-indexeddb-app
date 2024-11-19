import { Database } from './types';
// import { initDatabase } from './Sqldatabase';
import initSqlJs from 'sql.js';

const DB_NAME = 'MyDatabase';
const DB_VERSION = 3; // Incremented version to force onupgradeneeded
const STORE_NAME = 'sqlite';

// Utility to ensure database and object store
async function ensureDatabaseWithStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Delete the database first to avoid lingering issues during development
    indexedDB.deleteDatabase(DB_NAME);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      console.log("Upgrading database...");
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log("Created object store:", STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      console.log("Database opened with version:", db.version);
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.error(`Object store "${STORE_NAME}" is missing after upgrade.`);
        reject(new Error(`Object store "${STORE_NAME}" is missing.`));
      } else {
        resolve(db);
      }
    };

    request.onerror = (event) => {
      console.error("Error opening database:", event);
      reject(request.error);
    };
  });
}

// Save database function
export async function saveDatabase(db: Database) {
  const data = db.export();
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const idb = await ensureDatabaseWithStore();

  if (idb.objectStoreNames.contains(STORE_NAME)) {
    const transaction = idb.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: 1, data: blob });
    console.log("Data saved to object store:", STORE_NAME);
  } else {
    console.error('Object store "sqlite" not found.');
  }
}

// Load database function
export async function loadDatabase(): Promise<Database> {
  const idb = await ensureDatabaseWithStore();

  return new Promise<Database>((resolve, reject) => {
    const transaction = idb.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(1);

    getRequest.onsuccess = async () => {
      const record = getRequest.result;
      if (record) {
        const arrayBuffer = await record.data.arrayBuffer();
        const SQL = await initSqlJs();
        const db = new SQL.Database(new Uint8Array(arrayBuffer));
        console.log("Database loaded successfully from IndexedDB");
        resolve(db);
      } else {
        // console.log("No record found in IndexedDB, initializing new database");
        // const db = await initDatabase();
        // resolve(db);
      }
    };

    getRequest.onerror = () => {
      console.error("Error fetching data from IndexedDB:", getRequest.error);
      reject(getRequest.error);
    };
  });
}
