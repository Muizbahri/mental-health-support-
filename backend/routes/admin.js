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
    const result = await db.query(
      'INSERT INTO admin (full_name, ic_number, age, email, secret_code, phone_number, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fullName, icNumber, age, email, secretCode, phone, hashedPassword]
    );
    // Create JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign({ 
      id: result[0].insertId, 
      email: email, 
      full_name: fullName,
      role: 'admin' 
    }, jwtSecret, { expiresIn: '1d' });
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
    const token = jwt.sign({ 
      id: admin.id, 
      email: admin.email, 
      full_name: admin.full_name,
      role: 'admin' 
    }, jwtSecret, { expiresIn: '1d' });
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

// Get admin profile
router.get('/profile', verifyAdminToken, async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, full_name, ic_number, age, email, secret_code, phone_number FROM admin WHERE id = ?', [req.admin.id]);
    
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const admin = results[0];
    res.json({ success: true, admin });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Update admin profile
router.put('/profile', verifyAdminToken, async (req, res) => {
  try {
    const { fullName, icNumber, age, email, phone, currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    // Check if email already exists for other admins
    const [emailCheck] = await db.query('SELECT id FROM admin WHERE email = ? AND id != ?', [email, adminId]);
    if (emailCheck && emailCheck.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // If password change is requested, verify current password
    let updateQuery = 'UPDATE admin SET full_name = ?, ic_number = ?, age = ?, email = ?, phone_number = ? WHERE id = ?';
    let updateParams = [fullName, icNumber, age, email, phone, adminId];

    if (newPassword) {
      // Get current password hash
      const [adminData] = await db.query('SELECT password FROM admin WHERE id = ?', [adminId]);
      if (!adminData || adminData.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      // Verify current password
      const match = await bcrypt.compare(currentPassword, adminData[0].password);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updateQuery = 'UPDATE admin SET full_name = ?, ic_number = ?, age = ?, email = ?, phone_number = ?, password = ? WHERE id = ?';
      updateParams = [fullName, icNumber, age, email, phone, hashedNewPassword, adminId];
    }

    // Update admin profile
    await db.query(updateQuery, updateParams);

    // Get updated admin data (excluding password)
    const [updatedAdmin] = await db.query('SELECT id, full_name, ic_number, age, email, secret_code, phone_number FROM admin WHERE id = ?', [adminId]);
    
    res.json({ success: true, message: 'Profile updated successfully', admin: updatedAdmin[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Delete admin account
router.delete('/profile', verifyAdminToken, async (req, res) => {
  try {
    const adminId = req.admin.id;

    // Check if admin exists
    const [adminCheck] = await db.query('SELECT id FROM admin WHERE id = ?', [adminId]);
    if (!adminCheck || adminCheck.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Delete the admin account
    await db.query('DELETE FROM admin WHERE id = ?', [adminId]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Example protected route
router.get('/dashboard-data', verifyAdminToken, (req, res) => {
  res.json({ success: true, message: 'Protected dashboard data' });
});

module.exports = router; 