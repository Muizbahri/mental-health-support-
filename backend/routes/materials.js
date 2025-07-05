const express = require('express');
const router = express.Router();
const materialsController = require('../controllers/materialsController');

// Get all materials
router.get('/', materialsController.getAllMaterials);

// Get all materials by type
router.get('/:type', materialsController.getMaterialsByType);

// Add new material
router.post('/', materialsController.createMaterial);

// Update material by id
router.put('/:id', materialsController.updateMaterial);

// Delete material by id
router.delete('/:id', materialsController.deleteMaterial);

module.exports = router; 