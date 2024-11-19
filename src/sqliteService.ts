/* eslint-disable @typescript-eslint/no-explicit-any */
// src/sqliteService.ts
import initSqlJs, { Database } from "sql.js";

export interface MetadataItem {
    id: string;
    name: string;
    dimensions: { width: number; height: number; depth?: number };
    connectivity: { [key: string]: string | number | boolean };
}

// let dbInstance: Database | null = null; // Store SQLite instance globally
const SQL = await initSqlJs();
const db = new SQL.Database();

export async function saveToSQLite(data: any[]): Promise<Database> { 
        db.run(
        `CREATE TABLE IF NOT EXISTS metadata (
          id TEXT PRIMARY KEY,
          name TEXT,
          layerIndex INTEGER,
          visible BOOLEAN
                    
        )`
        );


      db.run("DELETE FROM metadata");

    const insertStmt = db.prepare("INSERT INTO metadata VALUES (?, ?, ?, ?)");

    for (const item of data) {
        insertStmt.run([
          item.id,
          item.name,
          item.layerIndex,
          item.visible,

        ]);
    }

    insertStmt.free();
    return db;
}


export interface SQLiteItem {
    id: string;
    name: string;
    layerIndex: number;
    visible: boolean;
}

// interface SQLiteResult {
//     columns: string[];
//     values: (string | number | boolean | null)[][];
// }

export async function loadFromSQLite(): Promise<SQLiteItem[]> {
    if (!db) {
        throw new Error("Database is not initialized. Call saveToSQLite first.");
      }
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'");
    console.log('result', result);

    // Check if we have results and transform them
    if (result.length > 0) {
        const [metadata] = result; // Get the first result set (assuming a single query)
        
        return metadata.values.map((row) => {
            const item: SQLiteItem = {
                id: row[0] as string,
                name: row[1] as string,
                layerIndex: row[2] as number,
                visible: row[3] as unknown as  boolean,
            };
            return item;
        });
    }

    return [];
}

// async function saveDatabaseToFile(db: Database) {
//     const data = db.export();
//     const blob = new Blob([data], { type: "application/octet-stream" });
  
//     // Use FileSaver.js or similar to save
//     const a = document.createElement("a");
//     a.href = URL.createObjectURL(blob);
//     a.download = "myDatabase.sqlite";
//     a.click();
//   }
  
//   // Call this function with your db instance
//   if (db) {
//     saveDatabaseToFile(db);
//   } else {
//     console.error("Database instance is null. Cannot save to file.");
//   }

