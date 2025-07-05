const express = require('express');
const router = express.Router();
const feedbacksController = require('../controllers/feedbacksController');

// Get feedbacks by role
router.get('/:role', feedbacksController.getFeedbacksByRole);

// Add new feedback
router.post('/', feedbacksController.createFeedback);

// Update feedback by id
router.put('/:id', feedbacksController.updateFeedback);

// Delete feedback by id
router.delete('/:id', feedbacksController.deleteFeedback);

module.exports = router; 