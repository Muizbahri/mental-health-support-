const db = require('../config/db');

exports.getFeedbacksByRole = async (role) => {
  const [rows] = await db.query('SELECT * FROM manage_feedbacks WHERE user_role = ? ORDER BY feedback_date DESC', [role]);
  return rows;
};

// Get all feedbacks (for admin use)
exports.getAllFeedbacks = async () => {
  const [rows] = await db.query('SELECT * FROM manage_feedbacks ORDER BY feedback_date DESC');
  return rows;
};

// Get feedbacks for a specific user by user_id
exports.getFeedbacksByUserId = async (user_id) => {
  const [rows] = await db.query(
    'SELECT * FROM manage_feedbacks WHERE user_id = ? ORDER BY feedback_date DESC',
    [user_id]
  );
  return rows;
};

// Create feedback with user_id
exports.createFeedback = async ({ user_id, user_role, full_name, type_of_feedback, feedback, feedback_date }) => {
  const [result] = await db.query(
    'INSERT INTO manage_feedbacks (user_id, user_role, full_name, type_of_feedback, feedback, feedback_date) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, user_role, full_name, type_of_feedback, feedback, feedback_date]
  );
  return result.insertId;
};

exports.updateFeedback = async (id, { user_role, full_name, type_of_feedback, feedback, feedback_date }) => {
  const [result] = await db.query(
    'UPDATE manage_feedbacks SET user_role=?, full_name=?, type_of_feedback=?, feedback=?, feedback_date=? WHERE id=?',
    [user_role, full_name, type_of_feedback, feedback, feedback_date, id]
  );
  return result.affectedRows > 0;
};

exports.deleteFeedback = async (id) => {
  const [result] = await db.query('DELETE FROM manage_feedbacks WHERE id=?', [id]);
  return result.affectedRows > 0;
};

// Delete feedback by id with user ownership verification (using user_id)
exports.deleteFeedbackByUserId = async (id, user_id) => {
  const [result] = await db.query(
    'DELETE FROM manage_feedbacks WHERE id=? AND user_id=?',
    [id, user_id]
  );
  return result.affectedRows > 0;
};

// Add admin response to feedback
exports.addAdminResponse = async (id, admin_response) => {
  // Always use Malaysia time (UTC+8) for response time
  const nowInMalaysia = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
  const responded_at = nowInMalaysia.toISOString().slice(0, 19).replace('T', ' ');
  
  const [result] = await db.query(
    'UPDATE manage_feedbacks SET admin_response=?, responded_at=? WHERE id=?',
    [admin_response, responded_at, id]
  );
  return result.affectedRows > 0;
};

// Get feedback by ID and verify ownership (for edit operations)
exports.getFeedbackByIdAndUserId = async (id, user_id) => {
  const [rows] = await db.query(
    'SELECT * FROM manage_feedbacks WHERE id=? AND user_id=?',
    [id, user_id]
  );
  return rows[0];
}; 