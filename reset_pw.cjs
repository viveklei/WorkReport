const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const email = process.argv[2] || 'marketing01@laserxprts.com';
const password = process.argv[3] || 'lei123';

async function reset() {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
        if (err) return console.error(err);
        console.log(`Password reset for ${email} to ${password}`);
        db.close();
    });
}

reset();
