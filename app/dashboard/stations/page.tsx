"use client"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, MapPin, Signal, Battery, Thermometer, Droplets, Wind, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const stations = [
  {
    id: 1,
    name: "Kigali City Center",
    location: "Nyarugenge District",
    coordinates: { lat: -1.9403, lng: 29.8739 },
    status: "online",
    aqi: 68,
    pm25: 35,
    pm10: 68,
    temperature: 24,
    humidity: 65,
    battery: 92,
    lastUpdate: "2 minutes ago",
  },
  {
    id: 2,
    name: "Kimironko Market",
    location: "Gasabo District",
    coordinates: { lat: -1.9422, lng: 30.1028 },
    status: "online",
    aqi: 45,
    pm25: 22,
    pm10: 42,
    temperature: 23,
    humidity: 68,
    battery: 88,
    lastUpdate: "1 minute ago",
  },
  {
    id: 3,
    name: "Kicukiro Industrial Zone",
    location: "Kicukiro District",
    coordinates: { lat: -1.9978, lng: 30.0731 },
    status: "online",
    aqi: 82,
    pm25: 42,
    pm10: 78,
    temperature: 25,
    humidity: 58,
    battery: 95,
    lastUpdate: "3 minutes ago",
  },
  {
    id: 4,
    name: "Nyabugogo Bus Terminal",
    location: "Nyarugenge District",
    coordinates: { lat: -1.9347, lng: 30.0539 },
    status: "online",
    aqi: 95,
    pm25: 48,
    pm10: 92,
    temperature: 26,
    humidity: 52,
    battery: 78,
    lastUpdate: "5 minutes ago",
  },
  {
    id: 5,
    name: "Remera Residential",
    location: "Gasabo District",
    coordinates: { lat: -1.9561, lng: 30.1062 },
    status: "offline",
    aqi: 0,
    pm25: 0,
    pm10: 0,
    temperature: 0,
    humidity: 0,
    battery: 12,
    lastUpdate: "2 hours ago",
  },
  {
    id: 6,
    name: "Gikondo Industrial",
    location: "Kicukiro District",
    coordinates: { lat: -1.9728, lng: 30.0592 },
    status: "maintenance",
    aqi: 0,
    pm25: 0,
    pm10: 0,
    temperature: 22,
    humidity: 70,
    battery: 100,
    lastUpdate: "Scheduled maintenance",
  },
  {
    id: 7,
    name: "Kibagabaga Hospital",
    location: "Gasabo District",
    coordinates: { lat: -1.9342, lng: 30.1178 },
    status: "online",
    aqi: 52,
    pm25: 28,
    pm10: 48,
    temperature: 22,
    humidity: 72,
    battery: 85,
    lastUpdate: "1 minute ago",
  },
  {
    id: 8,
    name: "Nyamirambo",
    location: "Nyarugenge District",
    coordinates: { lat: -1.9711, lng: 30.0403 },
    status: "online",
    aqi: 62,
    pm25: 32,
    pm10: 58,
    temperature: 23,
    humidity: 64,
    battery: 91,
    lastUpdate: "4 minutes ago",
  },
]

function getAQIStatus(aqi: number) {
  if (aqi === 0) return { label: "N/A", color: "bg-muted text-muted-foreground" }
  if (aqi <= 50) return { label: "Good", color: "bg-aqi-good text-background" }
  if (aqi <= 100) return { label: "Moderate", color: "bg-aqi-moderate text-background" }
  if (aqi <= 150) return { label: "Unhealthy (S)", color: "bg-aqi-unhealthy-sensitive text-background" }
  return { label: "Unhealthy", color: "bg-aqi-unhealthy text-background" }
}

function getStatusColor(status: string) {
  switch (status) {
    case "online":
      return "bg-aqi-good"
    case "offline":
      return "bg-aqi-unhealthy"
    case "maintenance":
      return "bg-aqi-moderate"
    default:
      return "bg-muted"
  }
}

export default function StationsPage() {
  const onlineCount = stations.filter(s => s.status === "online").length
  const offlineCount = stations.filter(s => s.status === "offline").length
  const maintenanceCount = stations.filter(s => s.status === "maintenance").length

  return (
    <>
      <Header
        title="Monitoring Stations"
        description="Manage and monitor air quality stations across Rwanda"
      />
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-aqi-good/20">
                  <Signal className="h-6 w-6 text-aqi-good" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
                  <p className="text-sm text-muted-foreground">Online Stations</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-aqi-unhealthy/20">
                  <Signal className="h-6 w-6 text-aqi-unhealthy" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
                  <p className="text-sm text-muted-foreground">Offline Stations</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-aqi-moderate/20">
                  <Signal className="h-6 w-6 text-aqi-moderate" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{maintenanceCount}</p>
                  <p className="text-sm text-muted-foreground">Under Maintenance</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                className="bg-card pl-9"
              />
            </div>
            <Button variant="outline" className="bg-card">
              All Stations
            </Button>
            <Button variant="outline" className="bg-card">
              Online Only
            </Button>
          </div>

          {/* Stations Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stations.map((station) => {
              const aqiStatus = getAQIStatus(station.aqi)
              return (
                <Card key={station.id} className="bg-card border-border">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-semibold text-foreground">
                        {station.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {station.location}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Station</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", getStatusColor(station.status))} />
                        <span className="text-xs capitalize text-muted-foreground">{station.status}</span>
                      </div>
                      <Badge className={cn("text-xs", aqiStatus.color)}>
                        AQI: {station.aqi || "N/A"}
                      </Badge>
                    </div>

                    {station.status === "online" && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-secondary p-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Wind className="h-3 w-3" />
                              PM2.5
                            </div>
                            <p className="text-sm font-medium text-foreground">{station.pm25} µg/m³</p>
                          </div>
                          <div className="rounded-lg bg-secondary p-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Wind className="h-3 w-3" />
                              PM10
                            </div>
                            <p className="text-sm font-medium text-foreground">{station.pm10} µg/m³</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Thermometer className="h-3 w-3" />
                            {station.temperature}°C
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Droplets className="h-3 w-3" />
                            {station.humidity}%
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Battery className="h-3 w-3" />
                            {station.battery}%
                          </div>
                        </div>
                      </>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Last updated: {station.lastUpdate}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Map Placeholder */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Station Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center rounded-lg bg-secondary">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Interactive map view</p>
                  <p className="text-xs text-muted-foreground">Showing {stations.length} monitoring stations across Kigali</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
