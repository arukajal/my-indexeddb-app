// import initSqlJs from 'sql.js';

// export async function initDatabase() {
//   const SQL = await initSqlJs({
//     locateFile: (file: string) => `./${file}`
//   });
//   const db = new SQL.Database();
//   return db;
// }

import initSqlJs from "sql.js";
import { fetchData } from "./apiservices";

export async function initializeDatabase() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run("CREATE TABLE IF NOT EXISTS data (id INTEGER PRIMARY KEY, info TEXT)");

  const data = await fetchData();
  const insertStmt = db.prepare("INSERT INTO data (info) VALUES (?)");
  insertStmt.run([JSON.stringify(data)]);
  insertStmt.free();

  return db;
}
