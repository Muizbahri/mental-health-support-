const express = require('express');
const router = express.Router();
const controller = require('../controllers/psychiatristAppointmentsController');

// GET /api/psychiatrist_appointments?psychiatrist_id=xx
router.get('/', controller.getPsychiatristAppointments);
// GET /api/psychiatrist-appointments/:psychiatrist_id (no auth)
router.get('/:psychiatrist_id', controller.getAppointmentsByPsychiatrist);
// POST /api/psychiatrist-appointments/:psychiatrist_id (create new appointment)
router.post('/:psychiatrist_id', controller.createPsychiatristAppointment);
// PUT /api/psychiatrist-appointments/:psychiatrist_id/:id (update appointment)
router.put('/:psychiatrist_id/:id', controller.updatePsychiatristAppointment);
// DELETE /api/psychiatrist-appointments/:psychiatrist_id/:id
router.delete('/:psychiatrist_id/:id', controller.deletePsychiatristAppointment);

module.exports = router; 