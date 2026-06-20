const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

async function fix() {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Fix Admin
    db.run('UPDATE users SET role = ?, password = ? WHERE email = ?', ['admin', hashedPassword, 'admin@lei.com'], (err) => {
        if (err) console.error(err);
        else console.log('Admin user fixed.');
    });

    // Fix Manager
    db.run('UPDATE users SET role = ?, password = ?, managed_departments = ? WHERE email = ?', 
        ['manager', hashedPassword, JSON.stringify(['INVENTORY']), 'marketing01@laserxprts.com'], (err) => {
        if (err) console.error(err);
        else console.log('Manager user fixed.');
        db.close();
    });
}

fix();
