"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

// Leaflet's default marker icons reference image files via relative URLs
// that don't resolve correctly under Next.js bundling, so point them at
// the CDN copies explicitly.
const driverIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface RideMapProps {
  lat: number;
  lng: number;
  popupText?: string;
}

/**
 * Single-marker live map, centered on the driver's last reported position.
 * Kept as a plain Leaflet integration (not react-leaflet's declarative API)
 * so re-centering on new coordinates is a simple imperative call.
 */
export default function RideMap({ lat, lng, popupText }: RideMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const marker = L.marker([lat, lng], { icon: driverIcon }).addTo(map);
    if (popupText) marker.bindPopup(popupText);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Only set up once; subsequent lat/lng changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={containerRef} className="h-96 w-full rounded-lg border border-zinc-200" />;
}
