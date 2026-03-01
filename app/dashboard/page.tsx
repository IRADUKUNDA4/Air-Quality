"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import * as XLSX from "xlsx"

import { AQICard } from "@/components/dashboard/aqi-card"
import { PollutantCard } from "@/components/dashboard/pollutant-card"
import { AQITrendChart } from "@/components/dashboard/aqi-trend-chart"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { Info, Download, RefreshCw, Navigation, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface DashboardData {
  currentAQI: any
  recentAlerts: any[]
  pollutants: any[]
  trendData: any[]
  stationStats: {
    total: number
    online: number
    offline: number
  }
}

const PREFERRED_POLLUTANT_ORDER = [
  "PM10",
  "PM2.5",
  "CO",
  "CO2",
  "NO2",
  "SO2",
  "TEMPERATURE",
  "HUMIDITY",
]

const parseDateSafely = (rawDate: any): Date | null => {
  if (!rawDate) return null
  const formattedString = String(rawDate).trim().replace(" ", "T")
  const date = new Date(formattedString)
  return isNaN(date.getTime()) ? null : date
}

const getPollutantUnit = (name: string, fallbackUnit?: string): string => {
  const cleanName = name.toUpperCase().trim()

  if (cleanName.includes("HUMIDITY")) return "%"
  if (cleanName.includes("TEMP")) return "°C"
  if (cleanName.includes("CO2")) return "ppm"
  if (cleanName.includes("CO") && !cleanName.includes("NO2")) return "ppm"
  if (
    cleanName.includes("NO2") || 
    cleanName.includes("SO2") || 
    cleanName.includes("O3") || 
    cleanName.includes("OZONE") ||
    cleanName.includes("NITROGEN")
  ) {
    return "ppm"
  }
  if (cleanName.includes("PM2.5") || cleanName.includes("PM25") || cleanName.includes("PM10")) {
    return "µg/m³"
  }

  return fallbackUnit || "ppm"
}

const getPollutantStatus = (name: string, value: number): "good" | "moderate" | "unhealthy" => {
  const cleanName = name.toUpperCase().trim()

  if (cleanName.includes("HUMIDITY")) {
    if (value >= 30 && value <= 60) return "good"
    if ((value >= 20 && value < 30) || (value > 60 && value <= 70)) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("PM2.5") || cleanName.includes("PM25")) {
    if (value <= 12.0) return "good"
    if (value <= 35.4) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("PM10")) {
    if (value <= 54) return "good"
    if (value <= 154) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("NO2")) {
    if (value <= 0.053) return "good"
    if (value <= 0.100) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("SO2")) {
    if (value <= 0.035) return "good"
    if (value <= 0.075) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("CO2")) {
    if (value <= 1000) return "good"
    if (value <= 2000) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("CO")) {
    if (value <= 4.4) return "good"
    if (value <= 9.4) return "moderate"
    return "unhealthy"
  }

  if (value <= 50) return "good"
  if (value <= 100) return "moderate"
  return "unhealthy"
}

const getStatusTextColor = (status: "good" | "moderate" | "unhealthy"): string => {
  switch (status) {
    case "good":
      return "text-emerald-600 dark:text-emerald-400"
    case "moderate":
      return "text-amber-500 dark:text-amber-400"
    case "unhealthy":
      return "text-red-500 dark:text-red-400"
    default:
      return "text-foreground"
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setLastUpdatedTime] = useState<string>("")
  const [selectedPollutant, setSelectedPollutant] = useState<string>("ALL")
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsActive, setGpsActive] = useState(false)

  // Live GPS Watcher
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setGpsActive(true)
        },
        (err) => {
          console.warn("GPS Tracking Error:", err.code, err.message)
          setGpsActive(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      console.warn("Geolocation API is not supported by this browser/environment.")
    }
  }, [])

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true)
    try {
      const response = await fetch("/api/dashboard/overview")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Server responded with status ${response.status}`)
      }

      // Enforce maximum 4 alerts on fetch
      if (result.data?.recentAlerts) {
        result.data.recentAlerts = result.data.recentAlerts.slice(0, 4)
      }

      setData(result.data)
      if (result.data?.currentAQI?.recorded_at) {
        const parsedDate = parseDateSafely(result.data.currentAQI.recorded_at)
        if (parsedDate) {
          setLastUpdatedTime(parsedDate.toLocaleTimeString())
        }
      }
      setError(null)
    } catch (err: any) {
      console.error("Dashboard fetch error:", err)
      if (!isSilent) {
        setError(err.message || "Failed to load dashboard data")
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(false)

    const pollInterval = setInterval(() => {
      fetchDashboardData(true)
    }, 5000)

    const sensorChannel = supabase
      .channel("realtime_dashboard_sensors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sensor_readings" },
        (payload) => {
          const newReading = payload.new as any
          if (!newReading) return

          const cleanName = (newReading.pollutant_name || "").toUpperCase().trim()
          if (cleanName.includes("NH3") || cleanName.includes("AMMONIA")) return

          const parsedDate = parseDateSafely(newReading.recorded_at || newReading.created_at)
          if (parsedDate) {
            setLastUpdatedTime(parsedDate.toLocaleTimeString())
          }

          setData((prevData) => {
            if (!prevData) return prevData

            const incomingAQI = Number(newReading.aqi_value ?? newReading.aqi ?? 0)
            const currentValidAQI = prevData.currentAQI?.aqi_value ?? 0
            const resolvedAQI = incomingAQI > 1 ? incomingAQI : currentValidAQI

            const updatedTrend = [newReading, ...(prevData.trendData || [])]

            return {
              ...prevData,
              currentAQI: {
                ...prevData.currentAQI,
                aqi_value: resolvedAQI,
                recorded_at: newReading.recorded_at || newReading.created_at || prevData.currentAQI?.recorded_at,
              },
              trendData: updatedTrend,
            }
          })
        }
      )
      .subscribe()

    const alertsChannel = supabase
      .channel("realtime_dashboard_alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new
          if (!newAlert) return

          setData((prevData) => {
            if (!prevData) return prevData
            // Enforce maximum 4 alerts on real-time arrival
            const updatedAlerts = [newAlert, ...(prevData.recentAlerts || [])].slice(0, 4)
            return {
              ...prevData,
              recentAlerts: updatedAlerts,
            }
          })
        }
      )
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(sensorChannel)
      supabase.removeChannel(alertsChannel)
    }
  }, [fetchDashboardData])

  const { uniquePollutants, availablePollutantNames } = useMemo(() => {
    if (!data?.trendData) return { uniquePollutants: [], availablePollutantNames: [] }

    const uniquePollutantsMap = new Map<string, any>()

    data.trendData.forEach((item: any) => {
      const name = item.pollutant_name?.trim() || "Unknown"
      const cleanName = name.toUpperCase()

      if (cleanName.includes("NH3") || cleanName.includes("AMMONIA")) return

      if (!uniquePollutantsMap.has(cleanName)) {
        uniquePollutantsMap.set(cleanName, { ...item, pollutant_name: name })
      }
    })

    const list = Array.from(uniquePollutantsMap.values())

    list.sort((a, b) => {
      const nameA = a.pollutant_name.toUpperCase().replace(".", "")
      const nameB = b.pollutant_name.toUpperCase().replace(".", "")

      const indexA = PREFERRED_POLLUTANT_ORDER.findIndex((p) => nameA.includes(p.replace(".", "")))
      const indexB = PREFERRED_POLLUTANT_ORDER.findIndex((p) => nameB.includes(p.replace(".", "")))

      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })

    const names = list.map((item) => item.pollutant_name)

    return { uniquePollutants: list, availablePollutantNames: names }
  }, [data?.trendData])

  const averageLevel = useMemo(() => {
    if (!data?.trendData || data.trendData.length === 0) return 0
    const filtered = data.trendData.filter((item: any) => {
      const cleanName = item.pollutant_name?.toUpperCase().trim() || ""
      if (cleanName.includes("NH3") || cleanName.includes("AMMONIA")) return false
      if (selectedPollutant === "ALL") return true
      return cleanName === selectedPollutant.toUpperCase().trim()
    })
    
    if (filtered.length === 0) return 0
    const validReadings = filtered.filter((i: any) => (i.concentration_value || 0) > 1)
    const listToCalculate = validReadings.length > 0 ? validReadings : filtered
    const total = listToCalculate.reduce((acc: number, item: any) => acc + (item.concentration_value || 0), 0)
    return Math.round(total / listToCalculate.length)
  }, [data?.trendData, selectedPollutant])

  const mapCoordinates = useMemo(() => {
    if (userLocation) {
      return userLocation
    }

    if (data?.trendData && data.trendData.length > 0) {
      const matchingReading = data.trendData.find((item: any) => {
        const lat = parseFloat(item.latitude || item.lat || item.stations?.latitude)
        const lng = parseFloat(item.longitude || item.lng || item.stations?.longitude)
        return !isNaN(lat) && !isNaN(lng)
      })

      if (matchingReading) {
        return {
          lat: parseFloat(matchingReading.latitude || matchingReading.lat || matchingReading.stations?.latitude),
          lng: parseFloat(matchingReading.longitude || matchingReading.lng || matchingReading.stations?.longitude),
        }
      }
    }

    return { lat: -1.9441, lng: 30.0619 }
  }, [userLocation, data?.trendData])

  const activeSensorsCount = useMemo(() => {
    if (data?.stationStats?.online !== undefined && data.stationStats.online > 0) {
      return data.stationStats.online
    }

    if (!data?.trendData || data.trendData.length === 0) return 1

    const uniqueDevices = new Set<string>()
    data.trendData.forEach((item: any) => {
      const identifier = item.sensor_id || item.station_id || item.device_id || item.district
      if (identifier) uniqueDevices.add(String(identifier))
    })

    return uniqueDevices.size > 0 ? uniqueDevices.size : 1
  }, [data?.stationStats, data?.trendData])

  const exportToExcel = async () => {
    try {
      setIsExporting(true)

      let allRecords: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data: batch, error: dbError } = await supabase
          .from("sensor_readings")
          .select("*")
          .order("recorded_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (dbError) {
          console.error("Supabase export query error:", dbError)
          break
        }

        if (batch && batch.length > 0) {
          allRecords = [...allRecords, ...batch]
          if (batch.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }

      const rawRecords = allRecords.length > 0 ? allRecords : (data?.trendData || [])

      const recordsToExport = rawRecords.filter((item: any) => {
        const cleanName = (item.pollutant_name || "").toUpperCase().trim()
        return !cleanName.includes("NH3") && !cleanName.includes("AMMONIA")
      })

      if (!recordsToExport || recordsToExport.length === 0) {
        alert("No historical records found to export.")
        return
      }

      const groupedByTimestampMap = new Map<string, any>()

      recordsToExport.forEach((item: any) => {
        const parsedDate = parseDateSafely(item.recorded_at || item.created_at)
        
        let timestampKey = "N/A"
        if (parsedDate) {
          const roundedDate = new Date(parsedDate)
          roundedDate.setSeconds(0, 0)
          roundedDate.setMinutes(Math.floor(roundedDate.getMinutes() / 2) * 2)
          timestampKey = roundedDate.toLocaleString("en-US")
        }

        const pollutantKey = (item.pollutant_name || "UNKNOWN").toUpperCase().trim()
        const val = Number(item.concentration_value ?? item.value ?? item.reading ?? 0)
        const unit = getPollutantUnit(pollutantKey, item.unit)

        // Prioritize dynamic GPS location if active, fallback to database coordinates
        const activeLat = userLocation?.lat ?? item.latitude ?? mapCoordinates.lat
        const activeLng = userLocation?.lng ?? item.longitude ?? mapCoordinates.lng

        if (!groupedByTimestampMap.has(timestampKey)) {
          groupedByTimestampMap.set(timestampKey, {
            "Recorded Date & Time": timestampKey,
            "Station / District": item.district || data?.currentAQI?.district || "Kigali Station",
            "AQI Index": item.aqi_value ?? item.aqi ?? "N/A",
            "Latitude": activeLat,
            "Longitude": activeLng,
          })
        }

        const rowObj = groupedByTimestampMap.get(timestampKey)!
        rowObj[`${pollutantKey} (${unit})`] = val
      })

      const formattedHistoryPivoted = Array.from(groupedByTimestampMap.values())

      const formattedSummary = uniquePollutants.map((item: any) => {
        const name = item.pollutant_name || "N/A"
        const val = Number(item.concentration_value ?? 0)
        return {
          "Pollutant Metric": name,
          "Latest Concentration": val,
          "Unit": getPollutantUnit(name, item.unit),
          "Current Status": getPollutantStatus(name, val).toUpperCase(),
          "Last Updated": parseDateSafely(item.recorded_at || item.created_at)?.toLocaleString("en-US") || "N/A",
        }
      })

      const workbook = XLSX.utils.book_new()
      
      const historySheet = XLSX.utils.json_to_sheet(formattedHistoryPivoted)
      const summarySheet = XLSX.utils.json_to_sheet(formattedSummary)

      XLSX.utils.book_append_sheet(workbook, historySheet, "Telemetry History (2-Min)")
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Current Overview")

      const dateStr = new Date().toISOString().slice(0, 10)
      const fileName = `Air_Quality_Telemetry_2Min_History_${dateStr}.xlsx`

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export error:", err)
      alert("An error occurred while generating the Excel export.")
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[80vh] p-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Fetching real-time station metrics...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 sm:text-base">Dashboard Connection Error</h3>
            <p className="mt-1 text-xs text-red-500 sm:text-sm">{error || "Failed to load data"}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              setError(null)
              fetchDashboardData(false)
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-all sm:text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Ensure max 4 alerts displayed on render
  const displayedAlerts = (data.recentAlerts || []).slice(0, 4)

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden bg-background">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Top Bar Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Dashboard Analytics
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Real-time air quality & environmental metrics for Kigali, Rwanda
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchDashboardData(false)}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 transition-all"
                title="Force refresh data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>

              <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all sm:text-sm disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 shrink-0" />
                )}
                <span>{isExporting ? "Exporting..." : "Export Record"}</span>
              </button>
            </div>
          </div>

          {/* Overview Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.currentAQI && (
              <AQICard
                value={Math.round(data.currentAQI.aqi_value || 0)}
                unit="AQI"
                label="Current AQI Index"
                location={data.currentAQI.district || "Kigali Station"}
              />
            )}
            <AQICard
              value={displayedAlerts.length}
              unit="Alerts"
              label="Active Network Alerts"
              location="Kigali Grid"
            />
            <AQICard
              value={averageLevel}
              unit={selectedPollutant === "ALL" ? "Avg Level" : getPollutantUnit(selectedPollutant)}
              label="Average Concentration"
              location={selectedPollutant === "ALL" ? "All Sensors" : selectedPollutant}
            />
          </div>

          {/* Unique Pollutants Breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                  Pollutant Metrics Breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Individual sensor parameters and environmental thresholds
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 self-start sm:self-auto">
                {activeSensorsCount} Active {activeSensorsCount === 1 ? "Sensor" : "Sensors"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {uniquePollutants.map((pollutant: any, index: number) => {
                const pName = pollutant.pollutant_name || "Pollutant"
                const pValue = pollutant.concentration_value || 0
                const resolvedUnit = getPollutantUnit(pName, pollutant.unit)
                const calculatedStatus = getPollutantStatus(pName, pValue)
                const valueColorClass = getStatusTextColor(calculatedStatus)

                return (
                  <PollutantCard
                    key={pollutant.id || `${pName}-${index}`}
                    name={pName}
                    value={
                      <span className={valueColorClass}>
                        {typeof pValue === "number" ? Math.round(pValue * 100) / 100 : pValue}
                      </span>
                    }
                    unit={resolvedUnit}
                    status={calculatedStatus}
                    description={pollutant.description || ""}
                  />
                )
              })}
            </div>
          </div>

          {/* Map, Calendar, Gauge */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            
            {/* 1. Map */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground sm:text-base">Station Location Map</h3>
                    {gpsActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Navigation className="h-2.5 w-2.5 fill-emerald-500 animate-pulse" />
                        Live GPS
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedPollutant}
                    onChange={(e) => setSelectedPollutant(e.target.value)}
                    className="max-w-[130px] truncate rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none"
                  >
                    <option value="ALL">All Pollutants</option>
                    {availablePollutantNames.map((name: string) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative h-52 sm:h-60 w-full overflow-hidden rounded-lg border border-border bg-muted/40">
                  <iframe
                    title="Station Map"
                    className="h-full w-full border-0 grayscale-[15%] contrast-[105%]"
                    src={`https://maps.google.com/maps?q=${mapCoordinates.lat},${mapCoordinates.lng}&z=15&output=embed`}
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Info className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {gpsActive ? "Real GPS Position" : "Station GPS"}: {mapCoordinates.lat.toFixed(4)}, {mapCoordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* 2. Calendar */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <h3 className="text-sm font-bold text-foreground sm:text-base">Monitoring Calendar</h3>
                  <select
                    value={selectedPollutant}
                    onChange={(e) => setSelectedPollutant(e.target.value)}
                    className="max-w-[130px] truncate rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none"
                  >
                    <option value="ALL">All Pollutants</option>
                    {availablePollutantNames.map((name: string) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex h-52 sm:h-60 w-full items-center justify-center rounded-lg border border-border bg-background/50 p-2">
                  <Calendar
                    onChange={(val) => setCalendarDate(val as Date)}
                    value={calendarDate}
                    className="w-full border-0 text-xs font-medium text-foreground rounded-lg bg-transparent"
                  />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Info className="h-4 w-4 shrink-0" />
                <span>Historical log date range</span>
              </div>
            </div>

            {/* 3. Gauge Meter */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <h3 className="text-sm font-bold text-foreground sm:text-base">AQI Gauge Meter</h3>
                  <select
                    value={selectedPollutant}
                    onChange={(e) => setSelectedPollutant(e.target.value)}
                    className="max-w-[130px] truncate rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none"
                  >
                    <option value="ALL">All Pollutants</option>
                    {availablePollutantNames.map((name: string) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex h-52 sm:h-60 flex-col items-center justify-center w-full">
                  <div className="relative flex h-36 w-full max-w-[240px] items-center justify-center overflow-hidden">
                    <svg className="h-full w-full" viewBox="0 0 200 110">
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted/40"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="url(#gauge-gradient)"
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * Math.min(averageLevel, 500)) / 500}
                        className="transition-all duration-700 ease-out"
                      />
                      <defs>
                        <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute bottom-2 text-center">
                      <span className="text-2xl font-black text-foreground tracking-tight">
                        {averageLevel}
                      </span>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                        {selectedPollutant === "ALL" ? "Avg Level" : selectedPollutant}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Info className="h-4 w-4 shrink-0" />
                <span>Real-time station reading intensity</span>
              </div>
            </div>

          </div>

          {/* Charts & Alerts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AQITrendChart data={data.trendData || []} selectedPollutant={selectedPollutant} />
            </div>
            <div className="lg:col-span-1">
              <RecentAlerts alerts={displayedAlerts} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}