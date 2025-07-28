const express = require('express');
const router = express.Router();
const referralRequestsController = require('../controllers/referralRequestsController');
const { authenticateToken, isPsychiatrist } = require('../middleware/authMiddleware');

// GET all referral requests, or filter by psychiatrist_id
router.get('/referral-requests', referralRequestsController.getReferralRequests);

// GET referral requests for authenticated psychiatrist only
router.get('/referral-requests/psychiatrist', authenticateToken, isPsychiatrist, referralRequestsController.getReferralRequestsForPsychiatrist);

// CREATE new referral request
router.post('/referral-requests', referralRequestsController.createReferralRequest);

// UPDATE referral request by id
router.put('/referral-requests/:id', referralRequestsController.updateReferralRequest);

// DELETE referral request by id
router.delete('/referral-requests/:id', referralRequestsController.deleteReferralRequest);

module.exports = router; 