/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import initSqlJs from "sql.js";
import { loadDatabase, saveDatabase } from "./indexDbNew";
import { initializeDatabase } from "./Sqldatabase";

export default function App() {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      const SQL = await initSqlJs();
      const db: initSqlJs.Database = (await loadDatabase(SQL)) || (await initializeDatabase());
      const results = db.exec("SELECT * FROM data");
      console.log("Results:", results);
      if (results[0]) {
        setData(results[0].values.map((val: any) => val[0]));
      }
      
      await saveDatabase(db); // Save to IndexedDB
    }

    loadData();
  }, []);

  return (
    <div>
      <h1>Data from API</h1>
      {data.map((item, index) => (
        <p key={index}>{item}</p>
      ))}
    </div>
  );
}
