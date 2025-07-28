const express = require('express');
const router = express.Router();
const feedbacksController = require('../controllers/feedbacksController');

// Get all feedbacks (for admin use) - MUST BE BEFORE /:role
router.get('/all', feedbacksController.getAllFeedbacks);

// Get feedbacks for a specific user
router.get('/my-feedbacks', feedbacksController.getUserFeedbacks);

// Get feedbacks by role
router.get('/:role', feedbacksController.getFeedbacksByRole);

// Submit new feedback (with user_id)
router.post('/submit', feedbacksController.submitFeedback);

// Add new feedback (legacy support)
router.post('/', feedbacksController.createFeedback);

// Update feedback by id
router.put('/:id', feedbacksController.updateFeedback);

// Delete feedback by id (admin only)
router.delete('/:id', feedbacksController.deleteFeedback);

// Delete feedback by user (with ownership verification)
router.delete('/user/:id', feedbacksController.deleteFeedbackByUser);

module.exports = router; 