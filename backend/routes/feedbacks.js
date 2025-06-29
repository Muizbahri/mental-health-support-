const express = require('express');
const router = express.Router();

// Wrap database import in try-catch to prevent module loading errors
let db;
try {
  db = require('../config/db');
} catch (error) {
  console.error('Failed to load database in feedbacks route:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Database connection error' });
  });
  module.exports = router;
  return;
}

// Get feedbacks by user_role - DEPRECATED in favor of specific routes below
// router.get('/:role', async (req, res) => {
//   try {
//     const { role } = req.params;
//     const [rows] = await db.query('SELECT * FROM manage_feedbacks WHERE user_role = ? ORDER BY feedback_date DESC', [role]);
//     res.json({ success: true, data: rows });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// Specific routes for each feedback type
router.get('/public', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM manage_feedbacks WHERE user_role = 'public' ORDER BY feedback_date DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/counselor', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM manage_feedbacks WHERE user_role = 'counselor' ORDER BY feedback_date DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/psychiatrist', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM manage_feedbacks WHERE user_role = 'psychiatrist' ORDER BY feedback_date DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new feedback
router.post('/', async (req, res) => {
  const { user_role, full_name, type_of_feedback, feedback, feedback_date } = req.body;

  console.log("Incoming feedback:", req.body); // Debug log

  try {
    if (!user_role || !full_name || !type_of_feedback || !feedback || !feedback_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    await db.query(
      'INSERT INTO manage_feedbacks (user_role, full_name, type_of_feedback, feedback, feedback_date) VALUES (?, ?, ?, ?, ?)',
      [user_role, full_name, type_of_feedback, feedback, feedback_date]
    );
    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error("Error inserting feedback:", error); // <-- log real error
    res.status(500).json({ message: 'Failed to submit feedback', error });
  }
});

// Update feedback by id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_role, full_name, type_of_feedback, feedback, feedback_date } = req.body;
    await db.query(
      'UPDATE manage_feedbacks SET user_role=?, full_name=?, type_of_feedback=?, feedback=?, feedback_date=? WHERE id=?',
      [user_role, full_name, type_of_feedback, feedback, feedback_date, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete feedback by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM manage_feedbacks WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 