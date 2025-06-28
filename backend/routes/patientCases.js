const express = require('express');
const router = express.Router();
const patientCasesController = require('../controllers/patientCasesController');

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