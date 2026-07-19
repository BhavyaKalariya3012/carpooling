"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

interface RouteMapProps {
  pickup?: LatLng | null;
  destination?: LatLng | null;
}

// Colored marker icons (green = pickup, red = destination) from the widely
// used leaflet-color-markers asset set; shadow reused from Leaflet's CDN.
function coloredIcon(color: "green" | "red") {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const pickupIcon = coloredIcon("green");
const destinationIcon = coloredIcon("red");

const INDIA_CENTER: [number, number] = [22.9734, 78.6569];

/**
 * Small map that plots pickup and/or destination pins. Recenters/zooms to
 * fit whichever points are set, and draws a line between them when both
 * exist. Renders nothing meaningful until at least one point is provided.
 */
export default function RouteMap({ pickup, destination }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
  }, []);

  // Redraw markers/line whenever the points change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers/line.
    layersRef.current.forEach((layer) => map.removeLayer(layer));
    layersRef.current = [];

    const points: [number, number][] = [];

    if (pickup) {
      const m = L.marker([pickup.lat, pickup.lng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup("Pickup");
      layersRef.current.push(m);
      points.push([pickup.lat, pickup.lng]);
    }

    if (destination) {
      const m = L.marker([destination.lat, destination.lng], { icon: destinationIcon })
        .addTo(map)
        .bindPopup("Destination");
      layersRef.current.push(m);
      points.push([destination.lat, destination.lng]);
    }

    if (pickup && destination) {
      const line = L.polyline(
        [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ],
        { color: "#3f3f46", weight: 3, dashArray: "6 6" }
      ).addTo(map);
      layersRef.current.push(line);
      map.fitBounds(L.latLngBounds(points).pad(0.3));
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.setView(INDIA_CENTER, 5);
    }
  }, [pickup, destination]);

  return <div ref={containerRef} className="h-72 w-full rounded-lg border border-zinc-200" />;
}
