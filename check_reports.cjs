const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT user_email, COUNT(*) as count FROM reports GROUP BY user_email', (err, rows) => {
    if (err) return console.error(err);
    console.log('--- Reports Per Email ---');
    console.table(rows);
    db.close();
});
