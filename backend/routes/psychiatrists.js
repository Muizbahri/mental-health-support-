const express = require('express');
const router = express.Router();

// Wrap controller import in try-catch to prevent module loading errors
let psychiatristsController;
try {
  psychiatristsController = require('../controllers/psychiatristsController');
} catch (error) {
  console.error('Failed to load psychiatristsController:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Controller loading error' });
  });
  module.exports = router;
  return;
}

const {
  getPsychiatrists,
  getPsychiatristById,
  createPsychiatrist,
  updatePsychiatrist,
  deletePsychiatrist
} = psychiatristsController;

const upload = require('../utils/upload');

// GET /api/psychiatrists
router.get('/psychiatrists', getPsychiatrists);
router.get('/psychiatrists/:id', getPsychiatristById);
router.post('/add-psychiatrist', upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'profile_image', maxCount: 1 }
]), createPsychiatrist);
router.put('/psychiatrists/:id', updatePsychiatrist);
router.delete('/psychiatrists/:id', deletePsychiatrist);

// Psychiatrist Login (dedicated endpoint)
router.post('/psychiatrists/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  email = email.trim().toLowerCase();
  console.log('Psychiatrist login attempt:', { email, password });
  try {
    const [results] = await require('../config/db').query('SELECT * FROM psychiatrists WHERE LOWER(TRIM(email)) = ?', [email]);
    console.log('Psychiatrist login query results:', results);
    if (!results || results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const user = results[0];
    if ((user.password || '').trim() !== password.trim()) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    console.error('Psychiatrist login error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router; 