const express = require('express');
const router = express.Router();
const {
  getCounselors,
  getCounselorById,
  createCounselor,
  updateCounselor,
  deleteCounselor
} = require('../controllers/counselorsController');
const upload = require('../utils/upload');
const db = require('../config/db');

// GET /api/counselors
router.get('/counselors', getCounselors);
router.get('/counselors/:id', getCounselorById);
router.post('/add-counselor', upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'profile_image', maxCount: 1 }
]), createCounselor);
router.put('/counselors/:id', updateCounselor);
router.delete('/counselors/:id', deleteCounselor);

// Counselor Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  try {
    const [results] = await db.query('SELECT * FROM counselors WHERE email = ?', [email]);
    if (!results || results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const user = results[0];
    // TODO: Use bcrypt for password comparison if passwords are hashed
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    console.error('Counselor login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router; 