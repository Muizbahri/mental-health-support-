const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Wrap database import in try-catch to prevent module loading errors
let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in users route:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Database connection error' });
  });
  module.exports = router;
  return;
}

// Wrap controller import in try-catch to prevent module loading errors
let publicUsersController;
try {
  publicUsersController = require('../controllers/publicUsersController');
} catch (error) {
  console.error('Failed to load publicUsersController:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Controller loading error' });
  });
  module.exports = router;
  return;
}

// Storage config
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// Add Public User
router.post('/add-public', upload.single('profile_image'), async (req, res) => {
  console.log('Add Public User - req.body:', req.body);
  console.log('Add Public User - req.file:', req.file);
  const { full_name, email, ic_number, phone_number, password } = req.body;
  const profile_image = req.file?.filename;

  // Calculate age from IC number
  function calculateAgeFromIC(ic) {
    const match = ic.match(/^(\d{2})(\d{2})(\d{2})/);
    if (!match) return null;
    let [_, yy, mm, dd] = match;
    yy = parseInt(yy, 10);
    mm = parseInt(mm, 10);
    dd = parseInt(dd, 10);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const century = yy > currentYear ? 1900 : 2000;
    const birthYear = century + yy;
    const birthDate = new Date(birthYear, mm - 1, dd);
    if (isNaN(birthDate.getTime())) return null;
    let age = now.getFullYear() - birthYear;
    const m = now.getMonth() - (mm - 1);
    if (m < 0 || (m === 0 && now.getDate() < dd)) {
      age--;
    }
    return age >= 0 && age < 150 ? age : null;
  }
  const age = calculateAgeFromIC(ic_number);

  try {
    // Check for existing user
    const [existing] = await db.query('SELECT id FROM user_public WHERE email = ? OR ic_number = ?', [email, ic_number]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'User with this email or IC number already exists.' });
    }

    await db.query(
      'INSERT INTO user_public (full_name, email, ic_number, age, phone_number, profile_image, password, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [full_name, email, ic_number, age, phone_number, profile_image, password]
    );
    return res.status(200).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Add user error:', error);
    return res.status(500).json({ message: 'Error while adding user', error: error.message });
  }
});

// GET all public users
router.get('/users/public', publicUsersController.getAllPublicUsers);

// DELETE public user
router.delete('/delete-public/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM user_public WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// DELETE counselor
router.delete('/delete-counselor/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM counselors WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// DELETE psychiatrist
router.delete('/delete-psychiatrist/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM psychiatrists WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

// Update Public User
router.put('/update-public/:id', upload.single('profile_image'), async (req, res) => {
  const { full_name, email, ic_number, age, phone_number, password } = req.body;
  let profile_image = req.file?.filename;
  try {
    // If no new file, keep the old one
    if (!profile_image) {
      const [[user]] = await db.query('SELECT profile_image FROM user_public WHERE id = ?', [req.params.id]);
      profile_image = user?.profile_image || null;
    }
    await db.query(
      'UPDATE user_public SET full_name=?, email=?, ic_number=?, age=?, phone_number=?, profile_image=?, password=? WHERE id=?',
      [full_name, email, ic_number, age, phone_number, profile_image, password, req.params.id]
    );
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Update Counselor
router.put('/update-counselor/:id', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
  const { full_name, email, ic_number, age, phone_number, registration_number, location, latitude, longitude, password } = req.body;
  let profile_image = req.files['profile_image']?.[0]?.filename;
  let certificate = req.files['certificate']?.[0]?.filename;
  try {
    // If no new files, keep the old ones
    const [[user]] = await db.query('SELECT profile_image, certificate FROM counselors WHERE id = ?', [req.params.id]);
    if (!profile_image) profile_image = user?.profile_image || null;
    if (!certificate) certificate = user?.certificate || null;
    await db.query(
      'UPDATE counselors SET full_name=?, email=?, ic_number=?, age=?, phone_number=?, registration_number=?, certificate=?, profile_image=?, location=?, latitude=?, longitude=?, password=? WHERE id=?',
      [full_name, email, ic_number, age, phone_number, registration_number, certificate, profile_image, location, latitude, longitude, password, req.params.id]
    );
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Update Psychiatrist
router.put('/update-psychiatrist/:id', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
  const { full_name, email, ic_number, age, phone_number, med_number, location, latitude, longitude, password } = req.body;
  let profile_image = req.files['profile_image']?.[0]?.filename;
  let certificate = req.files['certificate']?.[0]?.filename;
  try {
    // If no new files, keep the old ones
    const [[user]] = await db.query('SELECT profile_image, certificate FROM psychiatrists WHERE id = ?', [req.params.id]);
    if (!profile_image) profile_image = user?.profile_image || null;
    if (!certificate) certificate = user?.certificate || null;
    await db.query(
      'UPDATE psychiatrists SET full_name=?, email=?, ic_number=?, age=?, phone_number=?, med_number=?, certificate=?, profile_image=?, location=?, latitude=?, longitude=?, password=? WHERE id=?',
      [full_name, email, ic_number, age, phone_number, med_number, certificate, profile_image, location, latitude, longitude, password, req.params.id]
    );
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// Public User Login
router.post('/login', publicUsersController.loginPublicUser);

// Route for profile image upload
router.post('/user-public/upload-profile-image', upload.single('profile_image'), async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;
    const filename = req.file.filename;
    await db.query('UPDATE user_public SET profile_image = ? WHERE id = ?', [filename, userId]);
    res.json({ success: true, filename });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Delete user account
router.delete('/user-public/delete', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: "Missing user ID" });
  try {
    await db.query('DELETE FROM user_public WHERE id = ?', [id]);
    res.json({ success: true, message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete account." });
  }
});

// Get Public User Profile (protected)
router.get('/user-public/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const { id, email } = req.query;
    if (!id && !email) return res.status(400).json({ success: false, message: 'Missing id or email' });
    const [results] = await db.query('SELECT * FROM user_public WHERE id = ? OR email = ?', [id || null, email || null]);
    if (!results || results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = results[0];
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// Add this route if not present, or update the existing one:
router.put('/user-public/update', async (req, res) => {
  const { id, full_name, email, ic_number, age, phone_number, password } = req.body;
  if (!id) return res.status(400).json({ message: "Missing ID" });
  try {
    await db.query(
      'UPDATE user_public SET full_name = ?, email = ?, ic_number = ?, age = ?, phone_number = ?, password = ? WHERE id = ?',
      [full_name, email, ic_number, age, phone_number, password, id]
    );
    res.status(200).json({ message: 'User updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
});

module.exports = router; 