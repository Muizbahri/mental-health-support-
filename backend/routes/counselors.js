const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const counselorsController = require('../controllers/counselorsController');

// Extract controller methods for convenience
const {
  getCounselors,
  getCounselorById,
  createCounselor,
  updateCounselor,
  deleteCounselor
} = counselorsController;

// Storage config for file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

// GET /api/counselors - Get all registered counselors
router.get('/', counselorsController.listRegisteredCounselors);

// POST login
router.post('/login', counselorsController.loginCounselor);

// GET counselor profile (protected route) - must come before /:id
router.get('/profile/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const counselorId = decoded.id;
    
    const counselorsModel = require('../models/counselors');
    const counselor = await counselorsModel.getCounselorById(counselorId);
    
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }
    
    delete counselor.password;
    res.json({ success: true, data: counselor });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// PUT update counselor profile (protected route) - must come before /:id
router.put('/profile/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const counselorId = decoded.id;
    
    const { full_name, email, ic_number, age, phone_number, registration_number, location, address, latitude, longitude, password } = req.body;
    
    const counselorsModel = require('../models/counselors');
    const counselor = await counselorsModel.getCounselorById(counselorId);
    
    if (!counselor) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }
    
    const counselorData = {
      full_name, email, ic_number, age, phone_number, registration_number,
      certificate: counselor.certificate, profile_image: counselor.profile_image,
      location, address, latitude, longitude, password
    };
    
    const success = await counselorsModel.updateCounselor(counselorId, counselorData);
    if (!success) {
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// DELETE counselor account (protected route) - must come before /:id
router.delete('/account/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const counselorId = decoded.id;
    
    const counselorsModel = require('../models/counselors');
    const success = await counselorsModel.deleteCounselor(counselorId);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Counselor not found' });
    }
    
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// POST upload profile image (protected route)
router.post('/upload-profile-image', upload.single('profile_image'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, jwtSecret);
    const counselorId = decoded.id;
    const filename = req.file.filename;
    
    const counselorsModel = require('../models/counselors');
    await counselorsModel.updateProfileImage(counselorId, filename);
    
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
    const counselorId = decoded.id;
    const filename = req.file.filename;
    
    const counselorsModel = require('../models/counselors');
    await counselorsModel.updateCertificate(counselorId, filename);
    
    res.json({ success: true, filename });
  } catch (err) {
    console.error('Certificate upload error:', err);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// GET counselor by ID
router.get('/:id', getCounselorById);

// POST create new counselor
router.post('/', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), createCounselor);

// PUT update counselor
router.put('/:id', upload.fields([
  { name: 'profile_image', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), updateCounselor);

// DELETE counselor
router.delete('/:id', deleteCounselor);

module.exports = router; 