const axios = require('axios');

exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;
    const apiKey = process.env.GEOAPIFY_KEY;
    const url = `https://api.geoapify.com/v2/place-details?id=${placeId}&apiKey=${apiKey}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
};

exports.searchPlaces = async (req, res) => {
  try {
    const { text, lat, lon, radius = 5000 } = req.query;
    const apiKey = process.env.GEOAPIFY_KEY;
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&lat=${lat}&lon=${lon}&radius=${radius}&apiKey=${apiKey}`;
    
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
};

exports.getStaticMap = (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.GEOAPIFY_KEY;
  const url = `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=400&center=lonlat:${lon},${lat}&zoom=14&marker=lonlat:${lon},${lat};color:%23ff0000;size:medium&apiKey=${apiKey}`;
  res.json({ imageUrl: url });
}; 