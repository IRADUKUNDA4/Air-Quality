"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Search,
  MapPin,
  Signal,
  Battery,
  Thermometer,
  Droplets,
  Wind,
  MoreVertical,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"

const StationsMap = dynamic(() => import("@/components/dashboard/stations-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] items-center justify-center rounded-lg bg-muted/30 border border-dashed border-border">
      <p className="text-xs text-muted-foreground animate-pulse">Loading spatial map coverage...</p>
    </div>
  ),
})

interface Station {
  id: string | number
  name: string
  location?: string
  coordinates?: { lat: number; lng: number }
  status?: "online" | "offline" | "maintenance" | string
  aqi?: number
  pm25?: number
  pm10?: number
  temperature?: number
  humidity?: number
  battery?: number
  lastUpdate?: string
}

function getAQIStatus(aqi: number = 0) {
  if (aqi === 0) return { label: "N/A", color: "bg-muted text-muted-foreground" }
  if (aqi <= 50) return { label: "Good", color: "bg-emerald-500 text-white" }
  if (aqi <= 100) return { label: "Moderate", color: "bg-amber-500 text-white" }
  if (aqi <= 150) return { label: "Unhealthy (S)", color: "bg-orange-500 text-white" }
  return { label: "Unhealthy", color: "bg-red-500 text-white" }
}

function getStatusColor(status: string = "offline") {
  switch (status.toLowerCase()) {
    case "online":
      return "bg-emerald-500"
    case "offline":
      return "bg-red-500"
    case "maintenance":
      return "bg-amber-500"
    default:
      return "bg-muted"
  }
}

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<"all" | "online">("all")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchStations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stations")
      if (res.ok) {
        const data = await res.json()
        setStations(Array.isArray(data) ? data : [])
      } else {
        const { data, error } = await supabase
          .from("stations")
          .select("*")
          .order("name", { ascending: true })

        if (!error && data) {
          setStations(data as Station[])
        }
      }
    } catch (err) {
      console.error("Failed to fetch stations:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStations()

    const channel = supabase
      .channel("realtime_stations_page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stations" },
        () => {
          fetchStations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchStations])

  if (!isMounted) return null

  const filteredStations = stations.filter((station) => {
    const nameMatches = (station.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const locationMatches = (station.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSearch = nameMatches || locationMatches

    const matchesStatus =
      filterStatus === "all" ? true : (station.status || "").toLowerCase() === "online"

    return matchesSearch && matchesStatus
  })

  const onlineCount = stations.filter((s) => (s.status || "").toLowerCase() === "online").length
  const offlineCount = stations.filter((s) => (s.status || "").toLowerCase() === "offline").length
  const maintenanceCount = stations.filter((s) => (s.status || "").toLowerCase() === "maintenance").length

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden bg-background">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Integrated Header Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Monitoring Stations
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-3 w-3" /> Live Network
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Manage and monitor physical sensor hardware deployment across Rwanda
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStations}
              disabled={loading}
              className="h-9 gap-2 text-xs font-medium border-border"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              <span>Refresh Stations</span>
            </Button>
          </div>

          {/* Network Health Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border shadow-xs">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Signal className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{onlineCount}</p>
                  <p className="text-xs font-medium text-muted-foreground">Active Stations Online</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xs">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                  <Signal className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{offlineCount}</p>
                  <p className="text-xs font-medium text-muted-foreground">Offline Stations</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xs">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <Signal className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{maintenanceCount}</p>
                  <p className="text-xs font-medium text-muted-foreground">Under Maintenance</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search station by name or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card pl-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs"
                onClick={() => setFilterStatus("all")}
              >
                All ({stations.length})
              </Button>
              <Button
                variant={filterStatus === "online" ? "default" : "outline"}
                size="sm"
                className="h-9 text-xs"
                onClick={() => setFilterStatus("online")}
              >
                Online ({onlineCount})
              </Button>
            </div>
          </div>

          {/* Station Grid */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            </div>
          ) : filteredStations.length === 0 ? (
            <Card className="bg-card border-border p-12 text-center">
              <p className="text-xs text-muted-foreground font-medium">No stations found matching your search.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStations.map((station) => {
                const status = station.status || "offline"
                const aqi = station.aqi ?? 0
                const aqiStatus = getAQIStatus(aqi)
                const isOnline = status.toLowerCase() === "online"

                return (
                  <Card key={station.id} className="bg-card border-border flex flex-col justify-between shadow-xs">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 p-5">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-bold text-foreground">
                          {station.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {station.location || "N/A"}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs">View Station Diagnostics</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">Configure Thresholds</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">Download History</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>

                    <CardContent className="space-y-4 px-5 pb-5 pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", getStatusColor(status))} />
                          <span className="text-xs capitalize text-muted-foreground">{status}</span>
                        </div>
                        <Badge className={cn("text-[11px] font-medium px-2 py-0.5", aqiStatus.color)}>
                          AQI: {aqi > 0 ? aqi : "N/A"}
                        </Badge>
                      </div>

                      {isOnline ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-muted/40 p-2.5">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase">
                                <Wind className="h-3 w-3 text-blue-500" />
                                PM2.5
                              </div>
                              <p className="mt-1 text-xs font-bold text-foreground">{station.pm25 ?? 0} µg/m³</p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-2.5">
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold uppercase">
                                <Wind className="h-3 w-3 text-blue-500" />
                                PM10
                              </div>
                              <p className="mt-1 text-xs font-bold text-foreground">{station.pm10 ?? 0} µg/m³</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                              {station.temperature ?? 0}°C
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Droplets className="h-3.5 w-3.5 text-blue-500" />
                              {station.humidity ?? 0}%
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Battery className="h-3.5 w-3.5 text-emerald-500" />
                              {station.battery ?? 0}%
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                          <p className="text-xs text-muted-foreground">Telemetry stream offline</p>
                        </div>
                      )}

                      <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-2.5">
                        Last ping: {station.lastUpdate || "Just now"}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Dynamic Interactive Leaflet Map Section */}
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground">Spatial Network Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <StationsMap stations={filteredStations} />
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}