const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const managerEmail = 'accounts2@laserxprts.com';

db.serialize(() => {
    // 1. Check Manager's managed_departments
    db.get("SELECT managed_departments FROM users WHERE email = ?", [managerEmail], (err, row) => {
        if (err) return console.error(err);
        console.log('--- Manager Managed Departments ---');
        console.log(row.managed_departments);
        const depts = JSON.parse(row.managed_departments || '[]');

        if (depts.length === 0) {
            console.log('No managed departments found.');
            return;
        }

        // 2. Check users in those departments
        const placeholders = depts.map(() => '?').join(',');
        db.all(`SELECT email, name, department FROM users WHERE department IN (${placeholders})`, depts, (err, users) => {
            if (err) return console.error(err);
            console.log('\n--- Users in Managed Departments ---');
            console.table(users);

            // 3. Check reports for these users
            db.all(`
                SELECT r.user_email, u.name, u.department, COUNT(r.id) as report_count
                FROM reports r
                JOIN users u ON r.user_email = u.email
                WHERE u.department IN (${placeholders})
                GROUP BY r.user_email
            `, depts, (err, reportStats) => {
                if (err) return console.error(err);
                console.log('\n--- Report Stats for Managed Departments ---');
                console.table(reportStats);

                // 4. Find Dharani Dayalan specifically
                const dharani = users.find(u => u.name.includes('DHARANI'));
                if (dharani) {
                    console.log(`\n--- Debugging Dharani (${dharani.email}) ---`);
                    db.all("SELECT id, report_date, category FROM reports WHERE user_email = ?", [dharani.email], (err, reports) => {
                        console.log(`Total reports found in DB for ${dharani.email}: ${reports.length}`);
                        console.table(reports);
                        db.close();
                    });
                } else {
                    console.log('\nDHARANI DAYALAN not found in managed departments.');
                    db.close();
                }
            });
        });
    });
});
