"use client";
import { useState, useEffect } from "react";
import { Phone, AlertTriangle, MessageCircle, MapPin, CheckCircle, Shield, Menu, X, Search } from "lucide-react";
import Sidebar from "../Sidebar";
import { getDistance } from 'geolib';
import axios from 'axios';

const contacts = [
  {
    name: "Emergency Services (Police / Ambulance / Bomba)",
    number: "999",
    tag: "Emergency",
    tagColor: "bg-red-100 text-red-700",
    desc: "Nationwide emergency response",
  },
  {
    name: "Mental Health Psychosocial Support (MOH & MERCY)",
    number: "15555",
    tag: "Mental Health",
    tagColor: "bg-green-100 text-green-700",
    desc: "National mental health psychosocial support",
  },
  {
    name: "Befrienders KL (24/7 Helpline)",
    number: "03-7627 2929",
    tag: "Support",
    tagColor: "bg-blue-100 text-blue-700",
    desc: "Emotional support (24/7)",
  },
  {
    name: "Talian Kasih (KPWKM)",
    number: "15999",
    tag: "Support",
    tagColor: "bg-purple-100 text-purple-700",
    desc: "For abuse, domestic violence, etc.",
  },
];

const allCenters = [
  {
    name: "Hospital Melaka",
    address: "Jalan Mufti Haji Khalil, 75400 Melaka",
    lat: 2.2054,
    lng: 102.2542,
    status: "Open 24/7",
    phone: null,
    state: "Melaka"
  },
  {
    name: "Hospital Kuala Lumpur (HKL)",
    address: "Jalan Pahang, 50586 Kuala Lumpur, Malaysia",
    lat: 3.1705,
    lng: 101.6981,
    status: "Open 24/7",
    phone: null,
    state: "Kuala Lumpur"
  },
  {
    name: "MENTARI Selayang",
    address: "Jalan Ipoh, 68100 Batu Caves, Selangor, Malaysia",
    lat: 3.2409,
    lng: 101.6502,
    status: "Open 8am-5pm",
    phone: null,
    state: "Selangor"
  },
  {
    name: "Hospital Pulau Pinang",
    address: "Jalan Residensi, 10450 George Town, Pulau Pinang",
    lat: 5.4194,
    lng: 100.3131,
    status: "Open 24/7",
    phone: null,
    state: "Pulau Pinang"
  },
  {
    name: "Hospital Sultanah Aminah Johor Bahru",
    address: "Jalan Persiaran Abu Bakar Sultan, 80100 Johor Bahru, Johor",
    lat: 1.4634,
    lng: 103.7516,
    status: "Open 24/7",
    phone: null,
    state: "Johor"
  },
  {
    name: "Befrienders KL Center",
    address: "95 Jalan Templer, 46000 Petaling Jaya, Selangor, Malaysia",
    lat: 3.0996,
    lng: 101.6420,
    status: "Open 24/7",
    phone: "03-7627 2929",
    state: "Selangor"
  }
];

export default function EmergencyCasePage() {
  const [userLocation, setUserLocation] = useState(null);
  const [nearestCenters, setNearestCenters] = useState([]);
  const [geoError, setGeoError] = useState("");
  const [formData, setFormData] = useState({ fullName: '', icNumber: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search functionality state
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    function sortCentersByDistance(lat, lng) {
      const sorted = [...allCenters]
        .map(center => ({
          ...center,
          distance: getDistance(
            { latitude: lat, longitude: lng },
            { latitude: center.lat, longitude: center.lng }
          )
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      setNearestCenters(sorted);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          sortCentersByDistance(latitude, longitude);
        },
        (err) => {
          setGeoError("Location access denied. Showing default crisis centers sorted by KL.");
          // Fallback: Kuala Lumpur coordinates
          const fallbackLat = 3.139;
          const fallbackLng = 101.6869;
          sortCentersByDistance(fallbackLat, fallbackLng);
        }
      );
    } else {
      setGeoError("Geolocation not supported. Showing default crisis centers sorted by KL.");
      // Fallback: Kuala Lumpur coordinates
      const fallbackLat = 3.139;
      const fallbackLng = 101.6869;
      sortCentersByDistance(fallbackLat, fallbackLng);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!formData.fullName.trim() || !formData.icNumber.trim()) {
      alert("Please fill in both Full Name and IC Number.");
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/api/emergency-cases', {
        name_patient: formData.fullName.trim(),
        ic_number: formData.icNumber.trim()
      });
      
      if (response.data.success) {
        alert("Emergency case submitted successfully. Help is on the way.");
        setFormData({ fullName: '', icNumber: '' });
      } else {
        alert("Failed to submit emergency case: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error('Error submitting emergency case:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert("Failed to submit emergency case: " + error.response.data.message);
      } else {
        alert("Failed to submit emergency case. Please try again or call emergency services directly.");
      }
    }
  };

  // Geocoding function
  const geocodeAddress = async (address) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}, Malaysia&limit=1&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          success: true
        };
      }
      return { success: false };
    } catch (error) {
      console.error('Geocoding error:', error);
      return { success: false };
    }
  };

  // Search for emergency hospitals
  const handleSearch = async () => {
    if (!searchAddress.trim()) {
      setSearchError('Please enter an address or district name');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);

    try {
      // Geocode the search address
      const geoResult = await geocodeAddress(searchAddress.trim());
      
      if (!geoResult.success) {
        setSearchError('Could not find the location. Please check your spelling and try again.');
        setSearchLoading(false);
        return;
      }

      // Search for emergency hospitals using the coordinates
      const response = await axios.post('http://localhost:5000/api/emergency_cases/emergency-hospitals/search', {
        latitude: geoResult.latitude,
        longitude: geoResult.longitude
      });

      if (response.data.success) {
        setSearchResults(response.data.hospitals);
        setShowSearchResults(true);
        setSearchError('');
      } else {
        setSearchError('No emergency hospitals found near this location. Please try a different area.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search for hospitals. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchAddress(e.target.value);
    if (showSearchResults && e.target.value === '') {
      setShowSearchResults(false);
      setSearchResults([]);
      setSearchError('');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Hamburger menu for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white rounded-full p-2 shadow-lg border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={28} color="#000" className="text-black" stroke="#000" />
      </button>
      {/* Sidebar as drawer on mobile, static on desktop */}
      <div>
        {/* Mobile Drawer */}
        <div
          className={`fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} md:hidden`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 md:static md:translate-x-0 md:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:min-h-screen`}
        >
          {/* Close button for mobile */}
          <button
            className="md:hidden absolute top-4 right-4 z-50 bg-gray-100 rounded-full p-1 border border-gray-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} color="#000" />
          </button>
          <Sidebar activePage="EMERGENCY" />
        </aside>
      </div>
      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 transition-all duration-200">
        {/* Header Section */}
        <div className="bg-[#EF4444] rounded-t-2xl shadow text-white px-8 py-6 mb-8 flex items-center gap-4">
          <AlertTriangle size={32} className="text-white" />
          <div>
            <div className="text-2xl font-bold mb-1">Emergency Support</div>
            <div className="text-base">If you're experiencing a mental health crisis, you're not alone. Help is available immediately.</div>
          </div>
        </div>
        {/* Immediate Help */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="font-bold text-lg text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={20} className="text-red-500" /> Immediate Help</div>
            <div className="w-full flex flex-col gap-2">
              <div className="bg-red-50 rounded-lg p-4 flex flex-col items-center md:items-start">
                <div className="font-semibold text-gray-700 mb-2">If you're in immediate danger:</div>
                <button className="bg-[#EF4444] hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center gap-2 text-lg w-full md:w-auto justify-center"><Phone size={20} /> Call 911 Now</button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="font-bold text-lg text-blue-700 mb-2 flex items-center gap-2"><Shield size={20} className="text-blue-500" /> For crisis support:</div>
            <div className="w-full flex flex-col gap-2">
              <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center md:items-start">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg shadow flex items-center gap-2 text-lg w-full md:w-auto justify-center"><Phone size={20} /> Call 988</button>
              </div>
            </div>
          </div>
        </section>
        {/* Emergency Contacts */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-green-700 mb-4 flex items-center gap-2"><Phone size={22} className="text-green-500" /> Emergency Contacts</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.map((c, i) => (
              <div key={c.name + i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${c.tagColor}`}>{c.tag}</span>
                  <span className="font-semibold text-gray-800 text-base">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-700 font-bold text-lg">{c.number}</span>
                </div>
                <div className="text-gray-500 text-xs mb-2">{c.desc}</div>
                <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2 w-full md:w-auto justify-center"><Phone size={18} /> Call Now</button>
              </div>
            ))}
          </div>
        </section>
        {/* Crisis Centers Near You */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-blue-700 mb-4 flex items-center gap-2"><MapPin size={22} className="text-blue-500" /> Crisis Centers Near You</div>
          
          {/* Search Box */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Address or District
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchAddress}
                onChange={handleSearchInputChange}
                placeholder="Enter address or district (e.g., 'Jalan Mufti Haji Khalil, Melaka' or 'Ampang')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              />
              <button
                onClick={handleSearch}
                disabled={searchLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              >
                <Search size={18} />
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {searchError && (
              <div className="mt-2 text-red-600 text-sm">{searchError}</div>
            )}
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                Search Results ({searchResults.length} found)
              </h4>
              <div className="flex flex-col gap-4">
                {searchResults.map((hospital, i) => (
                  <div key={`search-${hospital.id}-${i}`} className="rounded-xl border border-gray-200 bg-blue-50 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800">{hospital.name}</div>
                      <div className="text-gray-500 text-sm">{hospital.address}</div>
                      <div className="text-blue-500 text-xs mb-1">
                        {hospital.city}, {hospital.state} • {hospital.distance.toFixed(1)} km away
                      </div>
                      {hospital.phone && (
                        <div className="text-green-600 text-sm font-medium">
                          📞 {hospital.phone}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">Emergency 24/7</span>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hospital.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2">
                          <MapPin size={16} /> Get Directions
                        </button>
                      </a>
                      {hospital.phone && (
                        <a href={`tel:${hospital.phone.replace(/[^\d]/g, '')}`}>
                          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2">
                            <Phone size={16} /> Call
                          </button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Nearest Centers */}
          {!showSearchResults && (
            <div>
              {geoError && <div className="text-red-500 mb-2 text-sm">{geoError}</div>}
              <div className="flex flex-col gap-4">
                {nearestCenters.map((center, i) => (
                  <div key={center.name + i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-semibold text-gray-800">{center.name}</div>
                      <div className="text-gray-500 text-sm">{center.address}</div>
                      <div className="text-blue-500 text-xs mb-1">{center.state} {center.distance ? `• ${(center.distance/1000).toFixed(1)} km away` : ''}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <span className={`text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700`}>{center.status}</span>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(center.address)}`} target="_blank" rel="noopener noreferrer">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2"><MapPin size={16} /> Get Directions</button>
                      </a>
                      {center.phone && (
                        <a href={`tel:${center.phone.replace(/[^\d]/g, '')}`}>
                          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow flex items-center gap-2"><Phone size={16} /> Call</button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        {/* Your Safety Plan */}
        <section className="bg-white rounded-2xl shadow p-6 mb-8">
          <div className="font-bold text-lg text-gray-800 mb-4">Your Safety Plan</div>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-100">
              <span className="font-semibold text-yellow-700">1. Recognize Warning Signs</span>
              <div className="text-gray-700 text-sm mt-1">Identify your personal triggers and early warning signs of crisis.</div>
            </div>
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-100">
              <span className="font-semibold text-blue-700">2. Use Coping Strategies</span>
              <div className="text-gray-700 text-sm mt-1">Practice breathing exercises, grounding techniques, or contact a trusted friend.</div>
            </div>
            <div className="rounded-lg p-4 bg-green-50 border border-green-100">
              <span className="font-semibold text-green-700">3. Reach Out for Help</span>
              <div className="text-gray-700 text-sm mt-1">Don't hesitate to use the emergency contacts above when you need immediate support.</div>
            </div>
          </div>
        </section>
        {/* 24/7 Chat Support */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h3 className="text-xl font-semibold text-red-600 mb-4">📄 Report Emergency Case</h3>
          <form onSubmit={handleEmergencySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">IC Number</label>
              <input
                type="text"
                name="icNumber"
                value={formData.icNumber}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 text-black"
              />
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
            >
              Submit Emergency Case
            </button>
          </form>
        </div>
      </main>
    </div>
  );
} 