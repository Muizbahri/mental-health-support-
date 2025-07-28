const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ngoActivitiesController = require('../controllers/ngoActivitiesController');

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/ngo_documents/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// POST: Add new NGO activity
router.post(
  '/ngo-activities',
  upload.fields([
    { name: 'ngo_registration_proof', maxCount: 1 },
    { name: 'supporting_document', maxCount: 1 }
  ]),
  ngoActivitiesController.createActivity
);

// GET all NGO activities
router.get('/ngo-activities', ngoActivitiesController.getAllActivities);

// UPDATE activity by ID
router.put(
  '/ngo-activities/:id',
  upload.fields([
    { name: 'ngo_registration_proof', maxCount: 1 },
    { name: 'supporting_document', maxCount: 1 }
  ]),
  ngoActivitiesController.updateActivity
);

// DELETE activity by ID
router.delete('/ngo-activities/:id', ngoActivitiesController.deleteActivity);

module.exports = router; 