import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapProps {
  address: string;
  customerName?: string;
}

export function DeliveryMap({ address, customerName }: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([0, 0], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Geocode address using OpenStreetMap Nominatim API
    const geocodeAddress = async () => {
      try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const coords = [parseFloat(lat), parseFloat(lon)] as [number, number];

          if (map.current) {
            map.current.setView(coords, 15);

            // Add marker with popup
            L.marker(coords, {
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
                `<div class="font-semibold text-sm">${customerName || 'Delivery Location'}</div><div class="text-xs text-gray-600">${address}</div>`
              )
              .openPopup()
              .addTo(map.current);
          }
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
    />
  );
}
