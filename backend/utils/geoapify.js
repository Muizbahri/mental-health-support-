const axios = require('axios');

async function geocodeAddress(address) {
  const apiKey = process.env.GEOAPIFY_KEY || 'fallback-api-key';
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;
  const response = await axios.get(url);
  return response.data; // Contains features, coordinates, etc.
}

module.exports = { geocodeAddress }; 