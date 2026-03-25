// server.js — Migrated Full-Stack Backend
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const path    = require('path');  // ← Added for static files

const app     = express();
const PORT    = 3000;
const SECRET_KEY = 'your-very-secure-secret'; // ⚠️ Use environment variables in production!

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────

// NEW: Serve static files (HTML, CSS, JS) from project root — PUT EARLY!
app.use(express.static(path.join(__dirname, '.')));

// Allow requests from VS Code Live Server (adjust port if yours differs)
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500']
}));

app.use(express.json());

// ── IN-MEMORY "DATABASE" (replace with MySQL later) ──────────────────────────

let users = [
  { id: 1, firstName: 'Admin', lastName: 'User',  email: 'admin@example.com', password: '', role: 'admin' },
  { id: 2, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: '', role: 'user'  }
];

// Hash the seed passwords once on startup
users[0].password = bcrypt.hashSync('admin123', 10);
users[1].password = bcrypt.hashSync('user123',  10);

// ── AUTH ROUTES ───────────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = users.find(u => u.email === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id:         users.length + 1,
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     email.toLowerCase().trim(),
    password:  hashedPassword,
    role:      'user'  // ⚠️ Never let the client choose the role!
  };

  users.push(newUser);
  res.status(201).json({ message: 'User registered successfully.', email: newUser.email, role: newUser.role });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = users.find(u => u.email === email.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // Sign a JWT that expires in 1 hour
  const token = jwt.sign(
    { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
  });
});

// ── PROTECTED ROUTES ──────────────────────────────────────────────────────────

// GET /api/profile — any authenticated user
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/admin/dashboard — admin only
app.get('/api/admin/dashboard', authenticateToken, authorizeRole('admin'), (req, res) => {
  res.json({ message: 'Welcome to the admin dashboard!', data: 'Secret admin info 🔒' });
});

// ── PUBLIC ROUTE ──────────────────────────────────────────────────────────────

// GET /api/content/guest
app.get('/api/content/guest', (req, res) => {
  res.json({ message: 'Public content — visible to all visitors.' });
});

// ── MIDDLEWARE FUNCTIONS ──────────────────────────────────────────────────────

/** Verify the Bearer token attached to the request. */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = decoded;
    next();
  });
}

/** Restrict route to a specific role. Must come AFTER authenticateToken. */
function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
    }
    next();
  };
}

// ── START ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  Backend running → http://localhost:${PORT}`);
  console.log(`\nDemo credentials:`);
  console.log(`  Admin  →  email: admin@example.com  |  password: admin123`);
  console.log(`  User   →  email: alice@example.com  |  password: user123`);
});