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

// Get all feedbacks (for admin use)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await feedbacksModel.getAllFeedbacks();
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    console.error('Error getting all feedbacks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get feedbacks for a specific user by user_id
exports.getUserFeedbacks = async (req, res) => {
  try {
    const user_id = req.query.user_id || req.body.user_id;
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Missing user_id' });
    }
    
    const feedbacks = await feedbacksModel.getFeedbacksByUserId(user_id);
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    console.error('Error getting user feedbacks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Submit new feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { user_id, user_role, full_name, type_of_feedback, feedback } = req.body;
    
    if (!user_id || !user_role || !full_name || !type_of_feedback || !feedback) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: user_id, user_role, full_name, type_of_feedback, feedback' 
      });
    }
    
    // Always use Malaysia time (UTC+8) for feedback creation
    const nowInMalaysia = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
    const currentDateTime = nowInMalaysia.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Feedback submission details:', {
      user_id,
      user_role,
      full_name,
      type_of_feedback,
      feedback: feedback.substring(0, 50) + '...',
      currentDateTime
    });
    
    const id = await feedbacksModel.createFeedback({ 
      user_id,
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

// Legacy createFeedback function (for backward compatibility)
exports.createFeedback = async (req, res) => {
  try {
    const { user_role, full_name, type_of_feedback, feedback } = req.body;
    if (!user_role || !full_name || !type_of_feedback || !feedback) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Always use Malaysia time (UTC+8) for feedback creation
    const nowInMalaysia = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }));
    const currentDateTime = nowInMalaysia.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Legacy feedback submission details:', {
      user_role,
      full_name,
      type_of_feedback,
      feedback: feedback.substring(0, 50) + '...',
      currentDateTime
    });
    
    // For legacy support, set user_id to null - this should be migrated
    const id = await feedbacksModel.createFeedback({ 
      user_id: null,
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

// Delete feedback with user ownership verification using user_id
exports.deleteFeedbackByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'Missing user_id' });
    }
    
    const success = await feedbacksModel.deleteFeedbackByUserId(id, user_id);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Feedback not found or not authorized to delete' });
    }
    
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (err) {
    console.error('Error deleting feedback:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}; 