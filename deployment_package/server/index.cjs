console.log('--- Server Script Initializing (CommonJS) ---');

const path = require('path');
const dotenv = require('dotenv');

// Load .env from server directory
try {
  dotenv.config({ path: path.join(__dirname, '.env') });
  console.log('Environment variables loaded from server/.env');
} catch (envErr) {
  console.error('Error loading .env file:', envErr.message);
}

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDB } = require('./db.cjs');
const rateLimit = require('express-rate-limit');

const app = express();

// --- SHARED UTILITIES ---
const safeParse = (str, fallback = []) => {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON Parse Error:', e.message, 'Input:', str);
    return fallback;
  }
};


// --- EARLY HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 'not-set-by-host'
  });
});

console.log('Express app instance created');
const PORT = process.env.PORT || 5003; 
const JWT_SECRET = process.env.JWT_SECRET || 'lei-report-portal-secret-key-2026';

console.log(`Final PORT to be used: ${PORT}`);



// CORS configuration
const allowedOrigins = [
  'https://reports.leip.co.in',
  'http://reports.leip.co.in',
  'https://report.leip.co.in',
  'http://report.leip.co.in',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
];


app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '200mb' })); // Increased from 10mb

// Serve static files from React build
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Rate limiting

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Increased to 5000 for extreme headroom
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Initialize DB
console.log('Initializing Database...');
try {
  initDB();
  console.log('Database initialized successfully');
} catch (dbErr) {
  console.error('DATABASE INITIALIZATION FAILED:', dbErr);
}

// --- Authentication Routes ---

app.post('/api/register', async (req, res) => {
  const { email, password, name, department, designation, reporting_person, photo } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.get(`SELECT COUNT(*) as count FROM users`, [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const role = (row.count === 0 || email === 'admin@lei.com') ? 'admin' : 'user';

      db.run(
        `INSERT INTO users (email, password, name, department, designation, reporting_person, photo, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, name, department, designation, reporting_person, photo, role],
        function(err) {
          if (err) {
            if (err.message && err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'User already exists' });
            }
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ message: 'User registered successfully', userId: this.lastID, role });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ email: user.email, id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Session expired or invalid',
        code: 'AUTH_EXPIRED'
      });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify Admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.email) return res.status(401).json({ error: 'Unauthorized' });

  if (req.user.email === 'admin@lei.com') return next();

  db.get(`SELECT role FROM users WHERE email = ?`, [req.user.email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error checking role' });
    
    if (user && String(user.role).toLowerCase() === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  });
};

const requireManager = (req, res, next) => {
  if (!req.user || !req.user.email) return res.status(401).json({ error: 'Unauthorized' });

  db.get(`SELECT role, managed_departments FROM users WHERE email = ?`, [req.user.email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error checking role' });
    
    if (user && (String(user.role).toLowerCase() === 'manager' || String(user.role).toLowerCase() === 'admin')) {
      req.user.managed_departments = safeParse(user.managed_departments, []);
      next();
    } else {

      res.status(403).json({ error: 'Manager access required' });
    }
  });
};

// --- Profile & Settings Routes ---

app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(`SELECT email, name, department, designation, reporting_person, photo, role FROM users WHERE email = ?`, [req.user.email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(user);
  });
});

app.post('/api/profile', authenticateToken, (req, res) => {
  const { name, department, designation, reporting_person, photo } = req.body;
  db.run(
    `UPDATE users SET name = ?, department = ?, designation = ?, reporting_person = ?, photo = ? WHERE email = ?`,
    [name, department, designation, reporting_person, photo, req.user.email],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

app.get('/api/settings', authenticateToken, (req, res) => {
  db.get(`SELECT * FROM settings WHERE user_email = ?`, [req.user.email], (err, settings) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(settings || {});
  });
});

app.post('/api/settings', authenticateToken, (req, res) => {
  const { theme, use_ai, report_tone, recipient_email, smart_memo } = req.body;
  db.run(
    `INSERT INTO settings (user_email, theme, use_ai, report_tone, recipient_email, smart_memo) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_email) DO UPDATE SET 
     theme=excluded.theme, use_ai=excluded.use_ai, report_tone=excluded.report_tone, recipient_email=excluded.recipient_email, smart_memo=excluded.smart_memo`,
    [req.user.email, theme, use_ai, report_tone, recipient_email, JSON.stringify(smart_memo || {})],

    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Settings updated successfully' });
    }
  );
});

// --- Reports & Draft Routes ---

app.get('/api/draft', authenticateToken, (req, res) => {
  db.get(`SELECT tasks_data, start_time, end_time FROM reports WHERE user_email = ? AND category = 'DRAFT' LIMIT 1`, [req.user.email], (err, draft) => {
    if (err) return res.status(500).json({ error: err.message });
    if (draft) {
      draft.tasks_data = safeParse(draft.tasks_data, []);
    }
    res.json(draft || { tasks_data: [] });
  });

});

app.post('/api/draft', authenticateToken, (req, res) => {
  const { tasks_data, start_time, end_time } = req.body;
  db.run(`DELETE FROM reports WHERE user_email = ? AND category = 'DRAFT'`, [req.user.email], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run(
      `INSERT INTO reports (user_email, report_date, category, tasks_data, selected_logos, start_time, end_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.email, new Date().toISOString().split('T')[0], 'DRAFT', JSON.stringify(tasks_data || []), '[]', start_time, end_time],

      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Draft saved successfully' });
      }
    );
  });
});

app.get('/api/reports', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM reports WHERE user_email = ? AND category != 'DRAFT' ORDER BY report_date DESC`, [req.user.email], (err, reports) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(reports.map(r => ({
      ...r,
      tasks_data: safeParse(r.tasks_data, []),
      selected_logos: safeParse(r.selected_logos, [])
    })));

  });
});

app.post('/api/reports', authenticateToken, (req, res) => {
  const { report_date, category, tasks_data, expanded_data, selected_logos, start_time, end_time } = req.body;
  
  db.run(
    `DELETE FROM reports WHERE user_email = ? AND report_date = ? AND category = ? AND category != 'DRAFT'`,
    [req.user.email, report_date, category],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      db.run(
        `INSERT INTO reports (user_email, report_date, category, tasks_data, expanded_data, selected_logos, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.email, report_date, category, JSON.stringify(tasks_data || []), JSON.stringify(expanded_data || []), JSON.stringify(selected_logos || []), start_time, end_time],

        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ message: 'Report saved successfully', reportId: this.lastID });
        }
      );
    }
  );
});

// --- Admin Routes ---

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  console.log('Fetching all users for admin');
  db.all(`SELECT id, email, name, department, designation, reporting_person, role, created_at FROM users`, [], (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users.map(u => ({ ...u, managed_departments: safeParse(u.managed_departments, []) })));
  });

});

app.get('/api/admin/all-reports', authenticateToken, requireAdmin, (req, res) => {
  db.all(`SELECT reports.*, users.name as user_name FROM reports JOIN users ON reports.user_email = users.email WHERE category != 'DRAFT' ORDER BY report_date DESC`, [], (err, reports) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(reports.map(r => ({
      ...r,
      tasks_data: safeParse(r.tasks_data, []),
      expanded_data: safeParse(r.expanded_data, []),
      selected_logos: safeParse(r.selected_logos, [])
    })));

  });
});

app.get('/api/admin/user-reports/:email', authenticateToken, requireAdmin, (req, res) => {
  db.all(`SELECT * FROM reports WHERE user_email = ? AND category != 'DRAFT' ORDER BY report_date DESC`, [req.params.email], (err, reports) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(reports.map(r => ({
      ...r,
      tasks_data: safeParse(r.tasks_data, []),
      selected_logos: safeParse(r.selected_logos, [])
    })));

  });
});

app.post('/api/admin/update-user', authenticateToken, requireAdmin, (req, res) => {
  const { email, role, name, department, designation, reporting_person } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  
  const updates = [];
  const params = [];
  
  if (role) { updates.push('role = ?'); params.push(String(role).toLowerCase()); }
  if (name) { updates.push('name = ?'); params.push(name); }
  if (department) { updates.push('department = ?'); params.push(department); }
  if (designation) { updates.push('designation = ?'); params.push(designation); }
  if (reporting_person) { updates.push('reporting_person = ?'); params.push(reporting_person); }
  if (req.body.managed_departments) { 
    updates.push('managed_departments = ?'); 
    params.push(JSON.stringify(req.body.managed_departments)); 
  }
  
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  params.push(email);
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE email = ?`, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User updated successfully' });
  });
});

app.post('/api/admin/delete-user', authenticateToken, requireAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (email === 'admin@lei.com') return res.status(403).json({ error: 'Cannot delete master admin' });

  db.run(`DELETE FROM users WHERE email = ?`, [email], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run(`DELETE FROM reports WHERE user_email = ?`, [email]);
    db.run(`DELETE FROM settings WHERE user_email = ?`, [email]);
    res.json({ message: 'User and associated records deleted permanently' });
  });
});

// --- Manager Routes ---

app.get('/api/manager/workforce', authenticateToken, requireManager, (req, res) => {
  const depts = req.user.managed_departments;
  if (!depts || depts.length === 0) return res.json([]);

  const placeholders = depts.map(() => '?').join(',');
  db.all(`SELECT id, email, name, department, designation, reporting_person, role, created_at FROM users WHERE department IN (${placeholders})`, depts, (err, users) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(users);
  });
});

app.get('/api/manager/reports', authenticateToken, requireManager, (req, res) => {
  const depts = req.user.managed_departments;
  if (!depts || depts.length === 0) return res.json([]);

  const placeholders = depts.map(() => '?').join(',');
  db.all(`
    SELECT reports.*, users.name as user_name 
    FROM reports 
    JOIN users ON reports.user_email = users.email 
    WHERE users.department IN (${placeholders}) AND reports.category != 'DRAFT' 
    ORDER BY reports.report_date DESC
  `, depts, (err, reports) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(reports.map(r => ({
      ...r,
      tasks_data: safeParse(r.tasks_data, []),
      expanded_data: safeParse(r.expanded_data, []),
      selected_logos: safeParse(r.selected_logos, [])
    })));

  });
});

// --- SPA Catch-all Route (Keep this at the end) ---
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {

  console.log(`Server is running!`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- API Base: /api`);
  console.log(`- JWT Secret configured: ${process.env.JWT_SECRET ? 'YES' : 'NO (using default)'}`);
  console.log(`- Allowed Origins: ${allowedOrigins.join(', ')}`);
});
