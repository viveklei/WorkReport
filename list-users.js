import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'server', 'database.sqlite');

const db = new sqlite3.Database(dbPath);
db.all("SELECT email, role FROM users", (err, rows) => {
  if (err) console.error(err);
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
