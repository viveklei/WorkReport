const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const email = 'stock.hsr@gmail.com';
const tasks = JSON.stringify([{id: 1, text: 'Stock Audit', category: 'General', time: '10:00 AM - 11:00 AM'}]);

db.run('INSERT INTO reports (user_email, report_date, category, tasks_data, created_at) VALUES (?, "2026-03-27", "Daily", ?, CURRENT_TIMESTAMP)', [email, tasks], (err) => {
    if (err) return console.error(err);
    console.log(`Sample report created for ${email}`);
    db.close();
});
