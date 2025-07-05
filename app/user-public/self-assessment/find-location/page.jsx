"use client";
import { useEffect, useState } from 'react';
import Sidebar from "../../Sidebar";
import dynamic from 'next/dynamic';
import { FaRoute } from 'react-icons/fa';
import { Menu, X } from "lucide-react";
import ReactDOM from "react-dom";

const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false });

export default function FindLocationPage() {
  const [professionals, setProfessionals] = useState([]);
  const [psychiatrists, setPsychiatrists] = useState([]);
  const [showType, setShowType] = useState('counselor'); // 'counselor' or 'psychiatrist'
  const [selectedLatLon, setSelectedLatLon] = useState([3.139, 101.6869]);
  const [selectedName, setSelectedName] = useState("Kuala Lumpur");
  const [routeCoords, setRouteCoords] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // {distance, time}
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const geoapifyKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Test function for debugging API connectivity
  const testGeoapifyAPI = async () => {
    const apiKey = geoapifyKey || 'f11e9d96b2ce4799bb35938168cfc842';
    const testUrl = `https://api.geoapify.com/v1/routing?waypoints=3.139,101.6869|3.140,101.6879&mode=drive&apiKey=${apiKey}`;
    
    console.log('Testing Geoapify API...');
    console.log('API Key:', apiKey ? 'Available' : 'Missing');
    
    try {
      const response = await fetch(testUrl);
      const data = await response.json();
      console.log('API Test Result:', response.status, data);
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      console.error('API Test Error:', error);
      return { success: false, error };
    }
  };

  // Expose test function to global scope for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.testGeoapifyAPI = testGeoapifyAPI;
      console.log('Debug function available: window.testGeoapifyAPI()');
    }
  }, [geoapifyKey]);

  // Portal root for sidebar/overlay
  const portalRoot = typeof window !== "undefined" ? document.body : null;

  useEffect(() => {
    // Fetch user's location when the component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert("Could not get your location. Please ensure location services are enabled.");
        }
      );
    }
  }, []);

  useEffect(() => {
            fetch("/api/counselors")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) {
          setProfessionals(data.data.map(p => ({ ...p, role: 'Counselor' })));
        } else {
          console.error("Unexpected data for counselors:", data);
          setProfessionals([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch professionals", err);
        setProfessionals([]);
      });
            fetch("/api/psychiatrists")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.data)) {
          setPsychiatrists(data.data.map(p => ({ ...p, role: 'Psychiatrist' })));
        } else {
          console.error("Unexpected data for psychiatrists:", data);
          setPsychiatrists([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch psychiatrists", err);
        setPsychiatrists([]);
      });
  }, []);

  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const allProfessionals = [...professionals, ...psychiatrists];

  const handleClick = (item) => {
    setSelectedProfessional(item);
    setRouteCoords(null);
    setRouteInfo(null);
  };

  const handleGo = async (prof) => {
    const destLat = parseFloat(prof.latitude);
    const destLon = parseFloat(prof.longitude);
    
    // Enhanced validation
    if (isNaN(destLat) || isNaN(destLon)) {
      console.error('Invalid destination coordinates:', prof.latitude, prof.longitude);
      alert('Invalid destination coordinates. Please contact support.');
      return;
    }
    
    if (!userLocation) {
      alert('Your location is not available. Please enable location services and try again.');
      return;
    }
    
    // Validate user location
    const userLat = userLocation.lat;
    const userLon = userLocation.lon;
    
    if (isNaN(userLat) || isNaN(userLon)) {
      console.error('Invalid user location:', userLocation);
      alert('Invalid user location. Please refresh the page and try again.');
      return;
    }
    
    console.log('Routing from:', userLat, userLon, 'to:', destLat, destLon);
    console.log('API Key available:', !!geoapifyKey);
    
    setLoadingRoute(true);
    setRouteCoords(null);
    setRouteInfo(null);
    setSelectedProfessional(prof);

    try {
      // Use the API key from environment variable
      const apiKey = geoapifyKey || process.env.NEXT_PUBLIC_GEOAPIFY_KEY || 'f11e9d96b2ce4799bb35938168cfc842';
      const url = `https://api.geoapify.com/v1/routing?waypoints=${userLat},${userLon}|${destLat},${destLon}&mode=drive&apiKey=${apiKey}`;
      
      console.log('Routing URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log('Routing API Response Status:', res.status);
      console.log('Routing API Response:', data);
      
      // Handle API errors
      if (!res.ok) {
        console.error('API Error:', res.status, data);
        if (res.status === 401) {
          alert('API key is invalid or expired. Please contact support.');
        } else if (res.status === 403) {
          alert('API usage limit exceeded. Please try again later.');
        } else {
          alert(`Routing service error (${res.status}). Please try again.`);
        }
        return;
      }
      
      // Handle successful response
      if (data.features && data.features.length > 0 && data.features[0].geometry) {
        const coords = data.features[0].geometry.coordinates[0];
        if (coords && coords.length > 0) {
          // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
          const route = coords.map(c => [c[1], c[0]]);
          setRouteCoords(route);
          
          const props = data.features[0].properties;
          setRouteInfo({
            distance: props.distance || 0, // meters
            time: props.time || 0 // seconds
          });
          
          console.log('Route found:', route.length, 'points');
        } else {
          console.error('No coordinates in route response');
          alert('Route data is incomplete. Please try again.');
        }
      } else {
        console.error('No route features found in response:', data);
        if (data.error) {
          alert(`Routing error: ${data.error.message || 'Unknown error'}`);
        } else {
          alert('No route found between your location and the destination. This might be due to geographical limitations.');
        }
      }
    } catch (err) {
      console.error('Routing request failed:', err);
      setRouteCoords(null);
      setRouteInfo(null);
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert('Failed to get route. Please try again.');
      }
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Hamburger menu for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-[10000] bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} color="#000" />
      </button>
      {/* Sidebar for desktop/tablet */}
      <div className="hidden md:block">
        <Sidebar activePage="FIND-LOCATIONS" />
      </div>
      {/* Sidebar as drawer on mobile, static on desktop */}
      {portalRoot && sidebarOpen && ReactDOM.createPortal(
        <>
          {/* Mobile Drawer Overlay - only when sidebarOpen is true */}
          <div
            className="fixed inset-0 z-[9999] bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar Drawer */}
          <aside
            className="fixed top-0 left-0 z-[10000] h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block translate-x-0 md:min-h-screen"
          >
            {/* Close button for mobile */}
            <button
              className="md:hidden absolute top-4 right-4 z-[10001] bg-gray-100 rounded-full p-1 border border-gray-300"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} color="#000" />
            </button>
            <Sidebar activePage="FIND-LOCATIONS" />
          </aside>
        </>, portalRoot
      )}
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Find Mental Health Services</h1>
        <p className="text-center text-gray-600 mb-8 text-lg">Locate nearby counselors and psychiatrists</p>
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* Map Section */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">�� Location Map</h2>
            
            {/* Debug Info Panel - Only show if there are issues */}
            {(!geoapifyKey || !userLocation) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Configuration Status</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>API Key: {geoapifyKey ? '✅ Available' : '❌ Missing'}</div>
                  <div>User Location: {userLocation ? '✅ Available' : '❌ Requesting...'}</div>
                  <div>Environment: {process.env.NODE_ENV || 'development'}</div>
                  {!geoapifyKey && (
                    <div className="text-yellow-600 mt-2">
                      <b>Note:</b> Using fallback API key. For production, set NEXT_PUBLIC_GEOAPIFY_KEY environment variable.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="h-96 w-full rounded-lg overflow-hidden border">
              <MapComponent
                professionals={allProfessionals}
                selectedProfessional={selectedProfessional}
                routeCoords={routeCoords}
                userLocation={userLocation}
                url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`}
              />
            </div>
            {routeInfo && (
              <div className="mt-4 flex justify-center">
                <div className="bg-green-100 border border-green-400 text-green-900 px-6 py-3 rounded-lg text-lg font-semibold shadow">
                  <span className="mr-4">Distance: <span className="font-bold">{(routeInfo.distance / 1000).toFixed(2)} km</span></span>
                  <span>Time: <span className="font-bold">{formatTime(routeInfo.time)}</span></span>
                </div>
              </div>
            )}
            
            {/* Debug/Test Controls - Only show in development or when testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => window.testGeoapifyAPI?.()}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                >
                  Test API
                </button>
                <button
                  onClick={() => console.log('Debug Info:', { userLocation, geoapifyKey: !!geoapifyKey, professionals: professionals.length })}
                  className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
                >
                  Debug Info
                </button>
              </div>
            )}
          </div>
          {/* Toggle for Counselors/Psychiatrists */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${showType === 'counselor' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setShowType('counselor')}
            >
              Show Counselors
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${showType === 'psychiatrist' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setShowType('psychiatrist')}
            >
              Show Psychiatrists
            </button>
          </div>
          {/* Professionals Only */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white rounded-2xl shadow p-6 col-span-2">
              <div className="font-bold text-xl text-purple-900 mb-4 flex items-center gap-2">
                <span role="img" aria-label="user">🧑‍⚕️</span> {showType === 'counselor' ? 'Mental Health Counselors' : 'Psychiatrists'}
              </div>
              <div className="flex flex-col gap-4">
                {showType === 'counselor' && Array.isArray(professionals) && professionals.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No data available</p>
                ) : showType === 'psychiatrist' && Array.isArray(psychiatrists) && psychiatrists.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No data available</p>
                ) : (
                  (showType === 'counselor' ? professionals : psychiatrists).map(prof => {
                    const lat = parseFloat(prof.latitude);
                    const lon = parseFloat(prof.longitude);
                    return (
                      <div
                        key={prof.id}
                        className="flex flex-col border rounded-lg p-3 bg-purple-50 mb-2 cursor-pointer hover:bg-purple-100 transition"
                        onClick={() => handleClick(prof)}
                      >
                        <div className="flex items-center gap-2">
                          <span role="img" aria-label="user">👤</span>
                          <span className="font-semibold text-gray-900">{prof.full_name}</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${showType === 'psychiatrist' ? 'bg-indigo-900 text-white' : 'bg-purple-200 text-purple-900'}`}>{showType === 'psychiatrist' ? 'Psychiatrist' : 'Counselor'}</span>
                          <button
                            className={`ml-3 flex items-center gap-1 px-2 py-1 ${loadingRoute ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded transition text-xs`}
                            onClick={e => { e.stopPropagation(); if (!isNaN(lat) && !isNaN(lon)) handleGo(prof); else alert('Invalid coordinates'); }}
                            disabled={loadingRoute}
                            title="Show route from your location"
                          >
                            {loadingRoute ? (
                              <>
                                <span className="animate-spin">⏳</span> Loading...
                              </>
                            ) : (
                              <>
                                <span role="img" aria-label="route">🛣️</span> Go
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-gray-600 text-sm">
                          <span role="img" aria-label="location">📍</span>
                          <span>{prof.location}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
          {/* Emergency Help Footer */}
          <div className="bg-blue-50 rounded-2xl shadow p-6 flex flex-col items-center mt-8">
            <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold text-lg">
              <span role="img" aria-label="alert">⚠️</span> Need Immediate Help?
            </div>
            <div className="text-gray-700 mb-4 text-center">If you're experiencing a mental health crisis, don't wait for an appointment.</div>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2 bg-white border border-blue-200 px-4 py-2 rounded-lg text-blue-700 font-semibold">
                <span role="img" aria-label="phone">📞</span> Emergency Hotline: 15999
              </div>
              <a href="/user-public/emergency-case" className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition">
                Visit Emergency Page
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds) return '';
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  const minLeft = min % 60;
  return `${hr} hr${hr > 1 ? 's' : ''} ${minLeft > 0 ? minLeft + ' min' : ''}`;
} 