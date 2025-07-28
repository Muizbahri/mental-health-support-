const express = require('express');
const router = express.Router();
const {
  getPlaceDetails,
  searchPlaces,
  getStaticMap
} = require('../controllers/geoapifyController');

router.get('/place-details/:placeId', getPlaceDetails);
router.get('/search', searchPlaces);
router.get('/static-map', getStaticMap);

module.exports = router; 