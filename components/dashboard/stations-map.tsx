"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default Leaflet icon assets in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Custom User Location Blue Pin Icon
const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = defaultIcon

interface Station {
  id: string | number
  name: string
  location?: string
  coordinates?: { lat: number; lng: number }
  status?: string
}

interface MapProps {
  stations: Station[]
  userLocation?: { lat: number; lng: number } | null
}

// Component to dynamically re-center map when GPS updates
function RecenterMap({ coords }: { coords: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], 13)
    }
  }, [coords, map])
  return null
}

export default function StationsMap({ stations, userLocation }: MapProps) {
  // Default map center (Kigali, Rwanda) if no GPS detected yet
  const defaultCenter = { lat: -1.9441, lng: 30.0619 }
  const center = userLocation || defaultCenter

  return (
    <div className="h-[350px] w-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic map re-centering trigger */}
        {userLocation && <RecenterMap coords={userLocation} />}

        {/* User GPS Pin */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="text-xs font-semibold">📍 My Live Location</div>
            </Popup>
          </Marker>
        )}

        {/* Station Markers */}
        {stations.map((station) => {
          if (!station.coordinates?.lat || !station.coordinates?.lng) return null
          return (
            <Marker
              key={station.id}
              position={[station.coordinates.lat, station.coordinates.lng]}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">{station.name}</p>
                  <p className="text-muted-foreground">{station.location}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}