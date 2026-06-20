const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 5001;
const dbPath = path.resolve(__dirname, 'database.sqlite');

console.log('--- DATABASE DIAGNOSTIC STARTING ---');
console.log('Node Version:', process.version);
console.log('DB Path:', dbPath);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  try {
    console.log('Attempting to open database...');
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('DB Open Error:', err.message);
        res.end(JSON.stringify({ status: 'DB_ERROR', error: err.message, node: process.version }));
        return;
      }
      
      console.log('DB opened. Running test query...');
      db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
        if (err) {
          console.error('Query Error:', err.message);
          res.end(JSON.stringify({ status: 'QUERY_ERROR', error: err.message }));
        } else {
          console.log('Test query successful');
          res.end(JSON.stringify({ status: 'SUCCESS', message: 'Database is working!', node: process.version }));
        }
        db.close();
      });
    });
  } catch (err) {
    console.error('CRITICAL CATCH:', err.message);
    res.end(JSON.stringify({ status: 'CRITICAL_FAILURE', error: err.message, stack: err.stack }));
  }
});

server.listen(PORT, () => {
  console.log(`Diagnostic server listening on port ${PORT}`);
});
