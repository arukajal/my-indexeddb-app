/* eslint-disable @typescript-eslint/no-explicit-any */
import { openDB } from "idb";

async function openOrUpgradeDatabase() {
    // Open the database and force upgrade by increasing the version if needed
    return await openDB("myDatabase", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Initial setup: Create the object store if starting from scratch
          db.createObjectStore("sqliteData");
        }
        if (oldVersion < 2) {
          // Future upgrades: Add or alter stores as needed for new versions
          if (!db.objectStoreNames.contains("sqliteData")) {
            db.createObjectStore("sqliteData");
          }
        }
      },
    });
  }
  

  export async function saveDatabase(db: any) {
    const dbBytes = db.export();
    const indexedDB = await openOrUpgradeDatabase();
    await indexedDB.put("sqliteData", dbBytes, "db");
  }
  
 export async function loadDatabase(SQL: any) {
    const indexedDB = await openOrUpgradeDatabase();
    const dbBytes = await indexedDB.get("sqliteData", "db");
    return dbBytes ? new SQL.Database(new Uint8Array(dbBytes)) : null;
  }