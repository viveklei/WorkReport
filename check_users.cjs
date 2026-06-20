const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT email, name, role, department, managed_departments FROM users', (err, rows) => {
    if (err) return console.error(err);
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
