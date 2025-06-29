const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { fullName, icNumber, age, email, secretCode, phone, password } = req.body;
    const [results] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
    if (results && results.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO admin (full_name, ic_number, age, email, secret_code, phone_number, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, icNumber, age, email, secretCode, phone, hashedPassword]
    );
    // Create JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '1d' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
    if (!results || results.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign({ email, role: 'admin' }, jwtSecret, { expiresIn: '1d' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
});

// Auth middleware
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) return res.status(401).json({ success: false, message: 'Invalid token' });
    req.admin = decoded;
    next();
  });
}

// Example protected route
router.get('/dashboard-data', verifyAdminToken, (req, res) => {
  res.json({ success: true, message: 'Protected dashboard data' });
});

module.exports = router; 