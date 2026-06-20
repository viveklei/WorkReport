const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Starting DB data export...');

db.all('SELECT email, name, role, department, managed_departments FROM users', (err, users) => {
    if (err) return console.error(err);
    const usersStr = JSON.stringify(users, null, 2);
    fs.writeFileSync('users_utf8.json', usersStr, 'utf8');
    console.log('Users exported to users_utf8.json');

    db.all('SELECT user_email, COUNT(*) as count FROM reports GROUP BY user_email', (err, reports) => {
        if (err) return console.error(err);
        const reportsStr = JSON.stringify(reports, null, 2);
        fs.writeFileSync('reports_utf8.json', reportsStr, 'utf8');
        console.log('Reports exported to reports_utf8.json');
        db.close();
    });
});
