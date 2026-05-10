"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export type MapStop = { id: string; label: string; lat: number; lng: number };

export default function TripLeafletMap({ stops }: { stops: MapStop[] }) {
  const center = stops[0] ?? { lat: 20, lng: 0 };
  const positions = stops.map((s) => [s.lat, s.lng] as [number, number]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={stops.length > 1 ? 4 : 5}
      className="h-[320px] w-full"
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {stops.length > 1 ? <Polyline positions={positions} pathOptions={{ color: "#3b82f6", weight: 3 }} /> : null}
      {stops.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={icon}>
          <Popup>{s.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
