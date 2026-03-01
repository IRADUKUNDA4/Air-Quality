"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix missing marker icons issue in Next.js/Leaflet
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface StationMapProps {
  stations: Array<{
    id: string | number
    name: string
    location?: string
    coordinates?: { lat: number; lng: number }
    aqi?: number
  }>
}

export default function StationsMap({ stations }: StationMapProps) {
  // Default map position centered over Kigali, Rwanda
  const kigaliCenter: [number, number] = [-1.9441, 30.0619]

  return (
    <div className="h-[350px] w-full rounded-lg overflow-hidden border border-border z-0">
      <MapContainer center={kigaliCenter} zoom={11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((s) => {
          const lat = s.coordinates?.lat
          const lng = s.coordinates?.lng

          if (!lat || !lng) return null

          return (
            <Marker key={s.id} position={[lat, lng]} icon={defaultIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs font-sans">
                  <p className="font-bold text-sm text-slate-900">{s.name}</p>
                  <p className="text-slate-600">{s.location || "Kigali"}</p>
                  <div className="pt-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      AQI: {s.aqi && s.aqi > 0 ? s.aqi : "N/A"}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}