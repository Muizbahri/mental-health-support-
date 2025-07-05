const feedbacksModel = require('../models/feedbacks');

exports.getFeedbacksByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const feedbacks = await feedbacksModel.getFeedbacksByRole(role);
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const { user_role, full_name, type_of_feedback, feedback } = req.body;
    if (!user_role || !full_name || !type_of_feedback || !feedback) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Always use Malaysia time (UTC+8) for feedback creation
    const nowInMalaysia = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
    const currentDateTime = nowInMalaysia.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Feedback submission details:', {
      user_role,
      full_name,
      type_of_feedback,
      feedback: feedback.substring(0, 50) + '...',
      currentDateTime
    });
    
    const id = await feedbacksModel.createFeedback({ 
      user_role, 
      full_name, 
      type_of_feedback, 
      feedback, 
      feedback_date: currentDateTime 
    });
    
    res.json({ success: true, id, feedback_date: currentDateTime });
  } catch (err) {
    console.error('Error creating feedback:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_role, full_name, type_of_feedback, feedback, feedback_date } = req.body;
    const success = await feedbacksModel.updateFeedback(id, { user_role, full_name, type_of_feedback, feedback, feedback_date });
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await feedbacksModel.deleteFeedback(id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}; 