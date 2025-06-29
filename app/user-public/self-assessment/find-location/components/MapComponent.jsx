"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
            url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${geoapifyApiKey}`}
            attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> contributors'
          />
          
          <ChangeView center={center} zoom={15} bounds={bounds} />

          {/* Markers for all professionals */}
          {professionals.map((pro) =>
            pro.latitude && pro.longitude ? (
              <Marker key={pro.id} position={[pro.latitude, pro.longitude]} icon={defaultIcon}>
                <Popup><b>{pro.full_name}</b><br />{pro.location}</Popup>
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