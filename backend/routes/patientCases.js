const express = require('express');
const router = express.Router();

// Wrap controller import in try-catch to prevent module loading errors
let patientCasesController;
try {
  patientCasesController = require('../controllers/patientCasesController');
} catch (error) {
  console.error('Failed to load patientCasesController:', error);
  // Export a router with error handlers
  router.use('*', (req, res) => {
    res.status(500).json({ success: false, message: 'Controller loading error' });
  });
  module.exports = router;
  return;
}

// GET /api/patient-cases (optionally filter by assigned_to)
router.get('/', patientCasesController.getAllPatientCases);

// GET /api/patient-cases/:psychiatrist (all for logged-in psychiatrist)
router.get('/:psychiatrist', patientCasesController.getPatientCasesByPsychiatrist);

// GET /api/patient-cases/:id
router.get('/id/:id', patientCasesController.getPatientCaseById);

// POST /api/patient-cases
router.post('/', patientCasesController.createPatientCase);

// PUT /api/patient-cases/:id
router.put('/:id', patientCasesController.updatePatientCase);

// DELETE /api/patient-cases/:id
router.delete('/:id', patientCasesController.deletePatientCase);

module.exports = router; 