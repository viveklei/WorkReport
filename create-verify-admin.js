import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'server', 'database.sqlite');

const db = new sqlite3.Database(dbPath);

const email = 'verify-admin@gmail.com';
const password = 'Password@123';
const name = 'Verification Admin';

bcrypt.hash(password, 10, (err, hash) => {
  db.run("INSERT OR REPLACE INTO users (email, password, name, role) VALUES (?, ?, ?, 'admin')", [email, hash, name], (err) => {
    if (err) console.error(err);
    console.log(`Admin user ${email} created with password ${password}`);
    db.close();
  });
});
