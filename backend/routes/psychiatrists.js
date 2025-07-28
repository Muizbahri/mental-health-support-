const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const psychiatristsController = require('../controllers/psychiatristsController');

// Storage config for file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// Extract controller methods for convenience
const {
  getPsychiatrists,
  getPsychiatristById,
  createPsychiatrist,
  updatePsychiatrist,
  deletePsychiatrist
} = psychiatristsController;

// GET all psychiatrists
router.get('/', psychiatristsController.listRegisteredPsychiatrists);

// GET psychiatrist by ID
router.get('/:id', getPsychiatristById);

// POST create new psychiatrist
router.post('/', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), createPsychiatrist);

// PUT update psychiatrist
router.put('/:id', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), updatePsychiatrist);

// DELETE psychiatrist
router.delete('/:id', deletePsychiatrist);

// POST login
router.post('/login', psychiatristsController.loginPsychiatrist);

// POST upload profile image (protected route)
router.post('/upload-profile-image', upload.single('profile_image'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const psychiatristId = decoded.id;
    const filename = req.file.filename;
    
    const psychiatristsModel = require('../models/psychiatrists');
    await psychiatristsModel.updateProfileImage(psychiatristId, filename);
    
    res.json({ success: true, filename });
  } catch (err) {
    console.error('Profile image upload error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// POST upload certificate (protected route)
router.post('/upload-certificate', upload.single('certificate'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const psychiatristId = decoded.id;
    const filename = req.file.filename;
    
    const psychiatristsModel = require('../models/psychiatrists');
    await psychiatristsModel.updateCertificate(psychiatristId, filename);
    
    res.json({ success: true, filename });
  } catch (err) {
    console.error('Certificate upload error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// GET psychiatrist profile (protected route)
router.get('/profile/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const psychiatristId = decoded.id;
    
    const psychiatristsModel = require('../models/psychiatrists');
    const psychiatrist = await psychiatristsModel.getPsychiatristById(psychiatristId);
    
    if (!psychiatrist) {
      return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
    }
    
    delete psychiatrist.password;
    res.json({ success: true, data: psychiatrist });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// PUT update psychiatrist profile (protected route)
router.put('/profile/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const psychiatristId = decoded.id;
    
    const { full_name, email, ic_number, age, phone_number, med_number, location, address, latitude, longitude, password } = req.body;
    
    const psychiatristsModel = require('../models/psychiatrists');
    const psychiatrist = await psychiatristsModel.getPsychiatristById(psychiatristId);
    
    if (!psychiatrist) {
      return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
    }
    
    const psychiatristData = {
      full_name, email, ic_number, age, phone_number, med_number,
      certificate: psychiatrist.certificate, profile_image: psychiatrist.profile_image,
      location, address, latitude, longitude, 
      password: (password !== undefined && password && password.trim() !== '') ? password : psychiatrist.password // Keep existing password if new one is empty or undefined
    };
    
    const success = await psychiatristsModel.updatePsychiatrist(psychiatristId, psychiatristData);
    if (!success) {
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// DELETE psychiatrist account (protected route)
router.delete('/account/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const psychiatristId = decoded.id;
    
    const psychiatristsModel = require('../models/psychiatrists');
    const success = await psychiatristsModel.deletePsychiatrist(psychiatristId);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Psychiatrist not found' });
    }
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// GET all psychiatrists
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM psychiatrists');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch psychiatrists', error: error.message });
  }
});

// Debug/test endpoint: GET /
router.get('/test', async (req, res) => {
  try {
    const psychiatrists = await require('../models/psychiatrists').getAllPsychiatrists();
    res.json(psychiatrists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 