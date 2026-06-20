const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('--- DB DUMP ---');

db.all("SELECT email, name, role, department, managed_departments FROM users", (err, users) => {
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    db.all("SELECT user_email, report_date, category FROM reports", (err, reports) => {
        console.log('\n--- REPORTS (Partial) ---');
        console.log(JSON.stringify(reports.slice(0, 10), null, 2));
        db.close();
    });
});
