"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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

export default function GeoapifyMap({ lat, lon, markerLat, markerLon, onMarkerMove }) {
  const markerRef = useRef(null);
  const center = [lat, lon];
  const markerPosition = [markerLat, markerLon];

  return (
    <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`}
        attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> contributors'
      />
      <ChangeView center={center} />
      <Marker
        position={markerPosition}
        icon={defaultIcon}
        draggable={!!onMarkerMove}
        eventHandlers={onMarkerMove ? {
          dragend: (e) => {
            const latlng = e.target.getLatLng();
            onMarkerMove(latlng.lat, latlng.lng);
          },
        } : {}}
        ref={markerRef}
      />
    </MapContainer>
  );
} 