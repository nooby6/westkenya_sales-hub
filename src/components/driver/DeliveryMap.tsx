import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapProps {
  address: string;
  customerName?: string;
}

export function DeliveryMap({ address, customerName }: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !address) return;

    // Initialize map only once
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current, {
        dragging: true,
        tap: true,
      }).setView([0, 0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    // Geocode address using OpenStreetMap Nominatim API
    const geocodeAddress = async () => {
      try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'Kabras-Driver-App',
            },
          }
        );
        const data = await response.json();

        if (data && data.length > 0 && mapInstance.current) {
          const { lat, lon } = data[0];
          const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];

          mapInstance.current.setView(coords, 16);

          // Remove old marker if exists
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker
          markerRef.current = L.marker(coords, {
            icon: L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
          })
            .bindPopup(
              `<div style="font-weight: bold; font-size: 12px;">${customerName || 'Delivery Location'}</div><div style="font-size: 11px; color: #666;">${address}</div>`
            )
            .openPopup()
            .addTo(mapInstance.current);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    };

    geocodeAddress();
  }, [address, customerName]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-64 rounded-lg border border-border/50 overflow-hidden"
      style={{ background: '#f5f5f5' }}
    />
  );
}
