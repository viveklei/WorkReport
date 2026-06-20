const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- Migration: Setting use_ai = 0 for all existing users ---');

db.run(`UPDATE settings SET use_ai = 0`, function(err) {
  if (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
  console.log(`Migration successful. ${this.changes} users updated.`);
  db.close();
});
