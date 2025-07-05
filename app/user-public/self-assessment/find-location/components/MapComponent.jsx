"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Add CSS for selected marker animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .selected-marker {
      animation: bounce 2s infinite;
      filter: hue-rotate(120deg) brightness(1.2);
    }
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }
  `;
  document.head.appendChild(style);
}

// Fix for default marker icon
const defaultIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Selected professional marker icon (larger and different color)
const selectedIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [35, 55],
  iconAnchor: [17, 55],
  popupAnchor: [1, -44],
  shadowSize: [55, 55],
  className: 'selected-marker'
});

const defaultPosition = [3.139, 101.6869]; // Default to Kuala Lumpur

function ChangeView({ center, zoom, bounds }) {
  const map = useMap();
  if (bounds && bounds.isValid()) {
    map.flyToBounds(bounds, { padding: [50, 50] });
  } else {
    map.flyTo(center, zoom);
  }
  return null;
}

function AutoOpenPopup({ selectedProfessional }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedProfessional?.latitude && selectedProfessional?.longitude) {
      // Small delay to ensure marker is rendered
      setTimeout(() => {
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            const lat = layer.getLatLng().lat;
            const lng = layer.getLatLng().lng;
            if (Math.abs(lat - selectedProfessional.latitude) < 0.0001 && 
                Math.abs(lng - selectedProfessional.longitude) < 0.0001) {
              layer.openPopup();
            }
          }
        });
      }, 500);
    }
  }, [selectedProfessional, map]);
  
  return null;
}

export default function MapComponent({
  professionals = [],
  selectedProfessional = null,
  routeCoords = null,
  userLocation = null,
  geoapifyApiKey,
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const center =
    selectedProfessional?.latitude && selectedProfessional?.longitude
      ? [selectedProfessional.latitude, selectedProfessional.longitude]
      : userLocation ? [userLocation.lat, userLocation.lon] : defaultPosition;
  
  const bounds = routeCoords && routeCoords.length > 0 ? L.latLngBounds(routeCoords) : null;

  // TEMP: Log the env key for debugging
  console.log("Geoapify Key:", process.env.NEXT_PUBLIC_GEOAPIFY_KEY);

  return (
    <div className="rounded-lg overflow-hidden" style={{ height: "100%", width: "100%" }}>
      {isClient ? (
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=f11e9d96b2ce4799bb35938168cfc842"
            attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> contributors'
          />
          
          <ChangeView center={center} zoom={15} bounds={bounds} />
          <AutoOpenPopup selectedProfessional={selectedProfessional} />

          {/* Markers for all professionals */}
          {professionals.map((pro) =>
            pro.latitude && pro.longitude ? (
              <Marker 
                key={pro.id} 
                position={[pro.latitude, pro.longitude]} 
                icon={selectedProfessional?.id === pro.id ? selectedIcon : defaultIcon}
              >
                <Popup>
                  <div className="text-center">
                    <b className="text-lg">{pro.full_name}</b><br />
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      pro.role === 'Counselor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {pro.role}
                    </span><br />
                    <span className="text-gray-600">{pro.location}</span>
                    {pro.phone && <><br /><span className="text-sm text-blue-600">📞 {pro.phone}</span></>}
                    {pro.email && <><br /><span className="text-sm text-blue-600">📧 {pro.email}</span></>}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
          
          {/* Polyline for the route */}
          {routeCoords && routeCoords.length > 0 && (
            <>
              <Polyline positions={routeCoords} color="blue" weight={5} />
              <Marker position={routeCoords[0]} icon={defaultIcon}>
                <Popup>Your Location</Popup>
              </Marker>
            </>
          )}

        </MapContainer>
      ) : (
        <div className="flex items-center justify-center h-full">Loading map...</div>
      )}
    </div>
  );
} 