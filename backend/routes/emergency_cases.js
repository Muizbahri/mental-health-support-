const express = require('express');
const router = express.Router();
const emergencyCaseController = require('../controllers/emergencyCaseController');
const { authenticateToken } = require('../middleware/authMiddleware');
const db = require('../config/db');

// POST /api/emergency_cases - Create a new emergency case (public route, no auth required)
router.post('/', emergencyCaseController.createPublicEmergencyCase);

// Search emergency hospitals by coordinates (public route, no auth required)
router.post('/emergency-hospitals/search', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Search emergency_hospitals table
    const [hospitals] = await db.query(`
      SELECT id, name, address, city, state, phone, latitude, longitude
      FROM emergency_hospitals
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Calculate distances using Haversine formula
    function calcDistance(lat1, lon1, lat2, lon2) {
      if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
      }
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    }

    // Calculate distances and add to hospitals
    const hospitalsWithDistance = hospitals.map(hospital => {
      const distance = calcDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(hospital.latitude),
        parseFloat(hospital.longitude)
      );
      return { ...hospital, distance };
    });

    // Filter within 50km radius and sort by distance
    const nearbyHospitals = hospitalsWithDistance
      .filter(hospital => hospital.distance <= 50)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Limit to 10 results

    res.json({
      success: true,
      hospitals: nearbyHospitals,
      count: nearbyHospitals.length
    });

  } catch (error) {
    console.error('Error searching emergency hospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/emergency_cases - List all emergency cases, or filter by assigned_to (NO AUTH REQUIRED)
router.get('/', emergencyCaseController.getAllEmergencyCases);

// GET /api/emergency-cases/psychiatrist/:id (NO AUTH REQUIRED)
router.get('/psychiatrist/:id', emergencyCaseController.getByPsychiatristId);

// POST /api/emergency_cases/admin - Create emergency case with full details (NO AUTH REQUIRED)
router.post('/admin', emergencyCaseController.createEmergencyCase);

// DELETE /api/emergency_cases/:id - Delete an emergency case by ID (NO AUTH REQUIRED)
router.delete('/:id', emergencyCaseController.deleteEmergencyCase);

// PUT /api/emergency_cases/:id - Update an emergency case by ID (NO AUTH REQUIRED)
router.put('/:id', emergencyCaseController.updateEmergencyCase);

// Note: All emergency case routes are now public (no authentication required for admin operations)

module.exports = router; 