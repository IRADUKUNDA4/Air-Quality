"use client"

import { useEffect, useState, useMemo } from "react"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import * as XLSX from "xlsx"

import { AQICard } from "@/components/dashboard/aqi-card"
import { PollutantCard } from "@/components/dashboard/pollutant-card"
import { AQITrendChart } from "@/components/dashboard/aqi-trend-chart"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { Info, Download, Sparkles } from "lucide-react"
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
  if (cleanName.includes("NH3")) return "µg/m³"
  if (cleanName.includes("CO2")) return "ppm"
  if (cleanName.includes("CO") && !cleanName.includes("NO2") && !cleanName.includes("CO2")) return "ppm"
  if (
    cleanName.includes("NO2") || 
    cleanName.includes("SO2") || 
    cleanName.includes("O3") || 
    cleanName.includes("OZONE") ||
    cleanName.includes("NITROGEN")
  ) {
    return "ppb"
  }
  if (cleanName.includes("PM2.5") || cleanName.includes("PM25") || cleanName.includes("PM10")) {
    return "µg/m³"
  }

  return fallbackUnit || "ppb"
}

const getPollutantStatus = (name: string, value: number): "good" | "moderate" | "unhealthy" => {
  const cleanName = name.toUpperCase().trim()

  if (cleanName.includes("HUMIDITY")) {
    if (value >= 30 && value <= 60) return "good"
    if ((value >= 20 && value < 30) || (value > 60 && value <= 70)) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("TEMP")) {
    if (value >= 18 && value <= 28) return "good"
    if ((value >= 15 && value < 18) || (value > 28 && value <= 32)) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("PM10")) {
    if (value <= 54) return "good"
    if (value <= 154) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("PM2.5") || cleanName.includes("PM25")) {
    if (value <= 12.0) return "good"
    if (value <= 35.4) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("CO2")) {
    if (value <= 1000) return "good"
    if (value <= 2000) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("NH3")) {
    if (value <= 200) return "good"
    if (value <= 400) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("NO2")) {
    if (value <= 53) return "good"
    if (value <= 100) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("SO2")) {
    if (value <= 35) return "good"
    if (value <= 75) return "moderate"
    return "unhealthy"
  }

  if (cleanName.includes("CO") && !cleanName.includes("CO2")) {
    if (value <= 4.4) return "good"
    if (value <= 9.4) return "moderate"
    return "unhealthy"
  }

  if (value <= 50) return "good"
  if (value <= 100) return "moderate"
  return "unhealthy"
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setLastUpdatedTime] = useState<string>("")
  const [selectedPollutant, setSelectedPollutant] = useState<string>("ALL")
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard/overview")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Server responded with status ${response.status}`)
      }

      setData(result.data)
      if (result.data?.currentAQI?.recorded_at) {
        const parsedDate = parseDateSafely(result.data.currentAQI.recorded_at)
        if (parsedDate) {
          setLastUpdatedTime(parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
        }
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err)
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()

    const sensorChannel = supabase
      .channel("realtime_sensors")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        (payload) => {
          const newReading = payload.new
          const parsedDate = parseDateSafely(newReading.recorded_at)
          if (parsedDate) {
            setLastUpdatedTime(parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
          }

          setData((prevData) => {
            if (!prevData) return prevData
            return {
              ...prevData,
              currentAQI: {
                ...prevData.currentAQI,
                aqi_value: newReading.concentration_value,
                recorded_at: newReading.recorded_at,
              },
              trendData: [newReading, ...(prevData.trendData || [])],
            }
          })
        }
      )
      .subscribe()

    const alertsChannel = supabase
      .channel("realtime_alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new
          setData((prevData) => {
            if (!prevData) return prevData
            return {
              ...prevData,
              recentAlerts: [newAlert, ...(prevData.recentAlerts || [])],
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sensorChannel)
      supabase.removeChannel(alertsChannel)
    }
  }, [])

  const hourlyFormattedTrendData = useMemo(() => {
    if (!data?.trendData || data.trendData.length === 0) return []

    const now = new Date()
    const currentHour = now.getHours()

    const windowHours: number[] = []
    for (let i = 11; i >= 0; i--) {
      let h = currentHour - i
      if (h < 0) h += 24
      windowHours.push(h)
    }

    const filteredReadings = data.trendData.filter((item: any) => {
      if (selectedPollutant === "ALL") return true
      return item.pollutant_name?.toUpperCase().trim() === selectedPollutant.toUpperCase().trim()
    })

    const hourlyMap = new Map<number, { sum: number; count: number }>()
    windowHours.forEach((h) => hourlyMap.set(h, { sum: 0, count: 0 }))

    filteredReadings.forEach((reading: any) => {
      const rawDate = reading.recorded_at || reading.created_at || reading.timestamp
      const date = parseDateSafely(rawDate)

      if (!date) return

      const readingHour = date.getHours()

      if (hourlyMap.has(readingHour)) {
        const val = Number(reading.concentration_value || reading.aqi_value || 0)
        const current = hourlyMap.get(readingHour)!
        hourlyMap.set(readingHour, { sum: current.sum + val, count: current.count + 1 })
      }
    })

    return windowHours.map((hour) => {
      const formattedHour = `${hour.toString().padStart(2, "0")}:00`
      const dataBucket = hourlyMap.get(hour)
      const avgValue = dataBucket && dataBucket.count > 0 
        ? Math.round(dataBucket.sum / dataBucket.count) 
        : 0

      return {
        time: formattedHour,
        hour,
        aqi: avgValue,
        concentration_value: avgValue,
      }
    })
  }, [data?.trendData, selectedPollutant])

  const averageLevel = useMemo(() => {
    if (!data?.trendData || data.trendData.length === 0) return 0
    const filtered = selectedPollutant === "ALL"
      ? data.trendData
      : data.trendData.filter((item: any) => 
          item.pollutant_name?.toUpperCase().trim() === selectedPollutant.toUpperCase().trim()
        )
    
    if (filtered.length === 0) return 0
    const total = filtered.reduce((acc: number, item: any) => acc + (item.concentration_value || 0), 0)
    return Math.round(total / filtered.length)
  }, [data?.trendData, selectedPollutant])

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

  const exportToExcel = () => {
    if (!data?.trendData || data.trendData.length === 0) return

    const groupedByTimestamp = new Map<string, Record<string, any>>()

    data.trendData.forEach((item: any) => {
      const rawDate = item.recorded_at || item.created_at
      const parsedDate = parseDateSafely(rawDate)

      // Formats timestamp without seconds (e.g., "8/24/2026, 12:57 PM")
      const timestampKey = parsedDate
        ? parsedDate.toLocaleString([], {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "N/A"

      if (!groupedByTimestamp.has(timestampKey)) {
        groupedByTimestamp.set(timestampKey, {
          "Display_Time": timestampKey,
          "AQI": Math.round(data.currentAQI?.aqi_value || 0),
        })
      }

      const row = groupedByTimestamp.get(timestampKey)!
      const pName = (item.pollutant_name || "UNKNOWN").trim()
      const val = item.concentration_value ?? 0

      row[pName] = val
    })

    const exportRows = Array.from(groupedByTimestamp.values())

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Air Quality Data")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    })

    const fileName = `Air_Quality_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
              fetchDashboardData()
            }}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-all sm:text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const uniquePollutantsMap = new Map<string, any>()
  ;(data.trendData || []).forEach((item: any) => {
    const name = item.pollutant_name || "Unknown"
    if (!uniquePollutantsMap.has(name)) {
      uniquePollutantsMap.set(name, item)
    }
  })
  const uniquePollutants = Array.from(uniquePollutantsMap.values())
  const availablePollutantNames = Array.from(uniquePollutantsMap.keys())

  const mapQuery = selectedPollutant === "ALL" 
    ? "Kigali Air Quality Station" 
    : `Kigali ${selectedPollutant} monitoring station`

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden bg-background">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Dashboard Analytics
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-3 w-3" /> Live Realtime
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Real-time air quality & environmental metrics for Kigali, Rwanda
              </p>
            </div>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all sm:text-sm"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>Export Report</span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.currentAQI && (
              <AQICard
                value={Math.round(data.currentAQI.aqi_value)}
                unit="AQI"
                label="Current AQI Index"
                location={data.currentAQI.district || "Kigali Station"}
              />
            )}
            <AQICard
              value={data.recentAlerts?.length ?? 0}
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

          {/* Pollutants Breakdown */}
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
              {uniquePollutants
                .sort((a: any, b: any) => {
                  const getPriority = (item: any) => {
                    const name = (item.pollutant_name || "").toUpperCase().trim()
                    if (name === "PM10" || name.includes("PM10")) return 1
                    if (name === "PM2.5" || name.includes("PM2.5") || name.includes("PM25")) return 2
                    if (name === "HUMIDITY" || name.includes("HUMIDITY")) return 999
                    return 50
                  }

                  const priorityA = getPriority(a)
                  const priorityB = getPriority(b)

                  if (priorityA !== priorityB) {
                    return priorityA - priorityB
                  }

                  const nameA = (a.pollutant_name || "").toUpperCase().trim()
                  const nameB = (b.pollutant_name || "").toUpperCase().trim()
                  return nameA.localeCompare(nameB)
                })
                .map((pollutant: any, index: number) => {
                  const pName = pollutant.pollutant_name || "Pollutant"
                  const pValue = pollutant.concentration_value || 0
                  const resolvedUnit = getPollutantUnit(pName, pollutant.unit)
                  const calculatedStatus = getPollutantStatus(pName, pValue)

                  return (
                    <PollutantCard
                      key={pollutant.id || `${pName}-${index}`}
                      name={pName}
                      value={typeof pValue === "number" ? Math.round(pValue * 100) / 100 : pValue}
                      unit={resolvedUnit}
                      status={calculatedStatus}
                      description={pollutant.description || ""}
                    />
                  )
                })}
            </div>
          </div>

          {/* Visual Panel Section */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Map */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <h3 className="text-sm font-bold text-foreground sm:text-base">Station Locations</h3>
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
                    title="Kigali Map"
                    className="h-full w-full border-0 grayscale-[15%] contrast-[105%]"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`}
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Info className="h-4 w-4 shrink-0" />
                <span className="truncate">Active Filter: {selectedPollutant}</span>
              </div>
            </div>

            {/* Calendar */}
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

            {/* AQI Gauge */}
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
                      <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {selectedPollutant === "ALL" ? "Avg AQI" : getPollutantUnit(selectedPollutant)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex w-full max-w-[240px] justify-between px-2 text-[10px] font-semibold text-muted-foreground">
                    <span>0</span>
                    <span>100</span>
                    <span>200</span>
                    <span>300</span>
                    <span>400</span>
                    <span>500+</span>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <Info className="h-4 w-4 shrink-0" />
                <span>Aggregated real-time index</span>
              </div>
            </div>
          </div>

          {/* Charts & Alerts */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="w-full min-w-0 overflow-hidden lg:col-span-2 rounded-xl border border-border bg-card p-1 shadow-xs">
              <AQITrendChart data={hourlyFormattedTrendData} />
            </div>
            <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xs">
              <RecentAlerts alerts={data.recentAlerts} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}