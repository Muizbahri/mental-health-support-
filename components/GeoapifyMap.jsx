"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = new L.Icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function GeoapifyMap({ 
  lat, 
  lon, 
  markerLat, 
  markerLon, 
  onMarkerMove, 
  onMapMove, // Support both prop names for backward compatibility
  height = "100%",
  width = "100%"
}) {
  const markerRef = useRef(null);
  
  // Handle coordinate validation and defaults
  const safeLat = lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : 3.139;
  const safeLon = lon && !isNaN(parseFloat(lon)) ? parseFloat(lon) : 101.6869;
  const safeMarkerLat = markerLat && !isNaN(parseFloat(markerLat)) ? parseFloat(markerLat) : safeLat;
  const safeMarkerLon = markerLon && !isNaN(parseFloat(markerLon)) ? parseFloat(markerLon) : safeLon;
  
  const center = [safeLat, safeLon];
  const markerPosition = [safeMarkerLat, safeMarkerLon];
  
  // Use the passed callback or fallback to the other prop name
  const handlePositionChange = onMarkerMove || onMapMove;

  // Get API key with fallback
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || 'f11e9d96b2ce4799bb35938168cfc842';
  
  // Debug logging
  useEffect(() => {
    console.log('🗺️ GeoapifyMap loaded:', {
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'None',
      center: center,
      hasCallback: !!handlePositionChange
    });
  }, []);
  
  // Configure tile layer with error handling
  const tileUrl = apiKey ? 
    `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}` :
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  
  const attribution = apiKey ? 
    '&copy; <a href="https://www.geoapify.com/">Geoapify</a> contributors' :
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div style={{ height, width, minHeight: "200px" }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ height: "100%", width: "100%" }} 
        scrollWheelZoom={true}
        key={`${safeLat}-${safeLon}`} // Key to force re-render when position changes
        whenReady={() => console.log('🗺️ Map container ready')}
      >
        <TileLayer
          url={tileUrl}
          attribution={attribution}
          maxZoom={19}
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
          eventHandlers={{
            loading: () => console.log('🔄 Tiles loading...'),
            load: () => console.log('✅ Tiles loaded successfully'),
            tileerror: (e) => console.error('❌ Tile error:', e)
          }}
        />
        <ChangeView center={center} />
        <MapClickHandler onMapClick={handlePositionChange} />
        <Marker
          position={markerPosition}
          icon={defaultIcon}
          draggable={!!handlePositionChange}
          eventHandlers={handlePositionChange ? {
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              console.log('📍 Marker moved to:', latlng.lat, latlng.lng);
              handlePositionChange(latlng.lat, latlng.lng);
            },
          } : {}}
          ref={markerRef}
        />
      </MapContainer>
    </div>
  );
} 