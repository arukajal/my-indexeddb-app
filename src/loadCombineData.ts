/* eslint-disable @typescript-eslint/no-explicit-any */
// src/loadCombinedData.ts
import { loadFromIndexedDB } from "./indexDBServices";
import { loadFromSQLite, SQLiteItem, saveToSQLite} from "./sqliteService";

interface IndexedDBItem {
    id: string;
    [key: string]: string | number | boolean | object | undefined;
}

export interface MetadataItem {
    id: string;
    name: string;
    dimensions: { width: number; height: number; depth?: number };
    connectivity: { [key: string]: string | number | boolean };
}
// interface SQLiteItem {
//     id: string;
//     [key: string]: string | number | boolean | object;
// }

export async function loadCombinedData(SQL: { Database: new () => any, dataToSave: MetadataItem[] }): Promise<(IndexedDBItem & { metadata?: SQLiteItem })[]> {

    const { dataToSave } = SQL;
    await saveToSQLite(dataToSave);

    const indexedDBData: IndexedDBItem[] = await loadFromIndexedDB();
    // const db = new SQL.Database();
    const sqliteData: SQLiteItem[] = await loadFromSQLite();

    // Combine data based on IDs
    const combinedData = indexedDBData.map((item) => {
        const metadata = sqliteData.find((meta) => meta.id === item.id);
        return { ...item, metadata };
    });

    return combinedData;
}
