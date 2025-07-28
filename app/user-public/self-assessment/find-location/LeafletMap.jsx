import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
import { useMap } from 'react-leaflet';

const customIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LeafletMap({ professionals, selectedPosition, selectedName }) {
  function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
      if (position) {
        map.setView(position, 15);
      }
    }, [position]);
    return null;
  }

  return (
    <MapContainer
      center={selectedPosition}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '300px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        url={`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {selectedPosition && (
        <Marker position={selectedPosition} icon={customIcon}>
          <Popup>{selectedName}</Popup>
        </Marker>
      )}
      <MapUpdater position={selectedPosition} />
    </MapContainer>
  );
} 