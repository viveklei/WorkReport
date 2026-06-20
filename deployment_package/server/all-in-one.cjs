const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;
const dbPath = path.resolve(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());

// HELLO WORLD ROUTE
app.get('/', (req, res) => {
  res.send('<h1>Backend is ALIVE</h1><p>Node Version: ' + process.version + '</p>');
});

// HEALTH CHECK WITH DB TEST
app.get('/api/health', (req, res) => {
  console.log('Health check requested...');
  try {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return res.json({ status: 'DB_ERROR', error: err.message, node: process.version });
      }
      res.json({ status: 'ok', msg: 'Express + SQLite working!', node: process.version });
      db.close();
    });
  } catch (err) {
    res.json({ status: 'CRITICAL_ERROR', error: err.message, node: process.version });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
