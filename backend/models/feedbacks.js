const db = require('../config/db');

exports.getFeedbacksByRole = async (role) => {
  const [rows] = await db.query('SELECT * FROM manage_feedbacks WHERE user_role = ? ORDER BY feedback_date DESC', [role]);
  return rows;
};

exports.createFeedback = async ({ user_role, full_name, type_of_feedback, feedback, feedback_date }) => {
  const [result] = await db.query(
    'INSERT INTO manage_feedbacks (user_role, full_name, type_of_feedback, feedback, feedback_date) VALUES (?, ?, ?, ?, ?)',
    [user_role, full_name, type_of_feedback, feedback, feedback_date]
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