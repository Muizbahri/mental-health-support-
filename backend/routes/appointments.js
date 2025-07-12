const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public route for creating appointments (no authentication required)
router.post('/create', appointmentsController.createPublicAppointment);

// Public route for getting appointments by user name (no authentication required)
router.get('/', appointmentsController.getPublicAppointments);

// Public route for updating appointments (no authentication required)
router.put('/:id', appointmentsController.updatePublicAppointment);

// Public route for deleting appointments (no authentication required)
router.delete('/:id', appointmentsController.deletePublicAppointment);

// Admin routes (no authentication required for admin operations)
router.post('/admin', appointmentsController.createAdminAppointment);
router.get('/admin', appointmentsController.getAdminAppointments);
router.put('/admin/:id', appointmentsController.updateAdminAppointment);
router.delete('/admin/:id', appointmentsController.deleteAdminAppointment);

// Get all psychiatrist appointments (admin access)
router.get('/psychiatrist', appointmentsController.getPsychiatristAppointments);

// Apply authentication to protected routes below
router.use(authenticateToken);

// Protected routes for authenticated users
router.post('/protected', appointmentsController.createAppointment);
router.get('/protected', appointmentsController.getAppointments);
router.get('/assignee/:assigned_to', appointmentsController.getAppointmentsByAssignee);
router.put('/protected/:id', appointmentsController.updateAppointment);
router.delete('/protected/:id', appointmentsController.deleteAppointment);

// Get psychiatrist appointments for logged-in psychiatrist
router.get('/psychiatrist/user', appointmentsController.getPsychiatristAppointmentsForUser);

module.exports = router; 