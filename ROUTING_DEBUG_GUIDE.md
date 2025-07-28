# Routing Debug Guide - Find Location Feature

## Issue: "No route found!" when clicking Go button

### Quick Debugging Steps

1. **Test on Production (caremental.online)**
   - Visit: `https://caremental.online/user-public/self-assessment/find-location?debug=true`
   - Check browser console for error messages
   - Use debug buttons to test API connectivity

2. **Console Commands for Testing**
   ```javascript
   // Test API connectivity
   window.testGeoapifyAPI()
   
   // Check current configuration
   console.log('API Key:', process.env.NEXT_PUBLIC_GEOAPIFY_KEY ? 'Available' : 'Missing')
   console.log('User Location:', navigator.geolocation ? 'Supported' : 'Not supported')
   ```

### Common Issues & Solutions

#### 1. **API Key Issues**
**Problem**: Invalid or missing Geoapify API key
**Symptoms**: 401 Unauthorized or 403 Forbidden errors
**Solution**:
- Check environment variable: `NEXT_PUBLIC_GEOAPIFY_KEY`
- Verify API key is valid in Geoapify dashboard
- Ensure domain `caremental.online` is whitelisted

#### 2. **Location Permission Issues**
**Problem**: User location not available
**Symptoms**: "Your location is not available" message
**Solution**:
- Enable location services in browser
- Allow location permission for the website
- Check if HTTPS is enabled (required for geolocation)

#### 3. **CORS/Network Issues**
**Problem**: API requests blocked by browser
**Symptoms**: Network errors in console
**Solution**:
- Ensure API calls are made over HTTPS
- Check if firewall/ad blockers are interfering
- Verify API endpoints are accessible

#### 4. **Coordinate Validation Issues**
**Problem**: Invalid coordinates for professionals
**Symptoms**: "Invalid coordinates" alerts
**Solution**:
- Check database for valid latitude/longitude values
- Ensure coordinates are in decimal format (e.g., 3.139, 101.6869)

### Environment Variables Setup

Add to your production environment:
```bash
NEXT_PUBLIC_GEOAPIFY_KEY=your_geoapify_api_key_here
```

### API Key Configuration

1. **Get Geoapify API Key**:
   - Visit: https://www.geoapify.com/
   - Sign up for free account
   - Create new project and get API key

2. **Configure API Key**:
   - Add domain `caremental.online` to allowed domains
   - Enable routing API permissions
   - Set usage limits if needed

### Testing in Production

1. **Enable Debug Mode**:
   Add `?debug=true` to URL: `https://caremental.online/user-public/self-assessment/find-location?debug=true`

2. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages and debug info

3. **Test API Directly**:
   ```javascript
   // Test routing API directly
   fetch('https://api.geoapify.com/v1/routing?waypoints=3.139,101.6869|3.140,101.6879&mode=drive&apiKey=YOUR_KEY')
     .then(res => res.json())
     .then(data => console.log('Direct API Test:', data))
   ```

### Expected Behavior

1. **User clicks Go button**
2. **System validates coordinates**
3. **API call is made to Geoapify**
4. **Route is displayed on map**
5. **Distance and time are shown**

### Logs to Check

Look for these in browser console:
- "Routing from: [lat] [lon] to: [lat] [lon]"
- "API Key available: true/false"
- "Routing API Response Status: 200"
- "Route found: X points"

### Contact Support

If issues persist:
1. Copy error messages from console
2. Note the specific counselor/psychiatrist being selected
3. Check if issue occurs with all professionals or just specific ones
4. Verify browser and device being used 