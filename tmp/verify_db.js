import { db, initDB } from '../server/db.js';

console.log("Triggering initDB...");
initDB();

// Give it a moment to complete the async migration
setTimeout(() => {
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log("Users Table Columns:");
    columns.forEach(col => console.log(`- ${col.name} (${col.type})`));
    
    const hasManagedDept = columns.some(col => col.name === 'managed_departments');
    if (hasManagedDept) {
      console.log("\nSUCCESS: managed_departments column exists.");
    } else {
      console.log("\nFAILURE: managed_departments column is still missing.");
    }
    db.close();
  });
}, 1000);
