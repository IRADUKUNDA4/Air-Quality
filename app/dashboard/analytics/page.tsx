"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import {
  Activity,
  Calendar,
  Wind,
  Droplets,
  Thermometer,
  Download,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react"

interface HourlyMetric {
  id: string
  created_at: string
  display_time?: string
  aqi: number
  pm25: number
  pm10: number
  no2: number
  so2: number
  co?: number
  nh3: number
  co2?: number
  temperature: number
  humidity: number
}

const POLLUTANT_COLORS: Record<string, string> = {
  "PM2.5": "#10b981",
  "PM10": "#3b82f6",
  "NO2": "#d97706",
  "SO2": "#ef4444",
  "NH3": "#8b5cf6",
}

const getAQIStatus = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" }
  if (aqi <= 100) return { label: "Moderate", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
  if (aqi <= 150) return { label: "Unhealthy", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" }
  return { label: "Critical", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" }
}

const getPM25Status = (pm25: number) => {
  if (pm25 <= 12.0) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" }
  if (pm25 <= 35.4) return { label: "Moderate", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
  if (pm25 <= 55.4) return { label: "Unhealthy", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" }
  return { label: "Critical", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" }
}

const calculateAQIFromPM25 = (pm25: number): number => {
  if (pm25 <= 0) return 0
  if (pm25 <= 12.0) return Math.round(((50 - 0) / (12.0 - 0)) * (pm25 - 0) + 0)
  if (pm25 <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51)
  if (pm25 <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101)
  if (pm25 <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151)
  if (pm25 <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201)
  if (pm25 <= 500.4) return Math.round(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301)
  return 500
}

const processDynamicReadings = (rawList: any[], period: string): HourlyMetric[] => {
  if (!Array.isArray(rawList) || rawList.length === 0) return []

  const grouped: Record<string, any> = {}

  rawList.forEach((item) => {
    const rawDate = item.recorded_at || item.created_at || item.timestamp || item.time
    if (!rawDate) return

    const dateObj = new Date(rawDate)
    if (isNaN(dateObj.getTime())) return

    let bucketKey: string
    const year = dateObj.getUTCFullYear()
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const day = String(dateObj.getUTCDate()).padStart(2, "0")
    const hours = String(dateObj.getUTCHours()).padStart(2, "0")

    // Dynamic timeframe bucketing logic
    switch (period) {
      case "24hours":
        // Group by Hourly buckets (e.g. 2026-03-30T14:00:00Z)
        bucketKey = `${year}-${month}-${day}T${hours}:00:00Z`
        break
      case "7days":
        // Group by Daily buckets (e.g. 2026-03-30)
        bucketKey = `${year}-${month}-${day}`
        break
      case "30days":
        // Group by 3-day window blocks for balanced density
        const dayNum = dateObj.getUTCDate()
        const threeDayBlock = String(Math.floor((dayNum - 1) / 3) * 3 + 1).padStart(2, "0")
        bucketKey = `${year}-${month}-${threeDayBlock}`
        break
      case "90days":
        // Group by Weekly buckets (Year + ISO Week or 7-day chunk)
        const dayOfYear = Math.floor((dateObj.getTime() - Date.UTC(year, 0, 0)) / (24 * 60 * 60 * 1000))
        const weekNum = String(Math.floor(dayOfYear / 7)).padStart(2, "0")
        bucketKey = `${year}-W${weekNum}`
        break
      default:
        bucketKey = `${year}-${month}-${day}`
    }

    if (!grouped[bucketKey]) {
      grouped[bucketKey] = {
        id: bucketKey,
        created_at: rawDate,
        raw_date: dateObj,
        aqi_sum: 0, aqi_count: 0,
        pm25_sum: 0, pm25_count: 0,
        pm10_sum: 0, pm10_count: 0,
        no2_sum: 0, no2_count: 0,
        so2_sum: 0, so2_count: 0,
        co_sum: 0, co_count: 0,
        nh3_sum: 0, nh3_count: 0,
        co2_sum: 0, co2_count: 0,
        temp_sum: 0, temp_count: 0,
        hum_sum: 0, hum_count: 0,
      }
    }

    const val = Number(item.concentration_value ?? item.value ?? item.reading ?? 0)
    const pName = String(item.pollutant_name ?? item.pollutant ?? "").toUpperCase().trim()

    if (pName.includes("PM2.5") || pName.includes("PM25")) {
      grouped[bucketKey].pm25_sum += val; grouped[bucketKey].pm25_count++
    } else if (pName.includes("PM10")) {
      grouped[bucketKey].pm10_sum += val; grouped[bucketKey].pm10_count++
    } else if (pName.includes("AQI")) {
      grouped[bucketKey].aqi_sum += val; grouped[bucketKey].aqi_count++
    } else if (pName.includes("NO2")) {
      grouped[bucketKey].no2_sum += val; grouped[bucketKey].no2_count++
    } else if (pName.includes("SO2")) {
      grouped[bucketKey].so2_sum += val; grouped[bucketKey].so2_count++
    } else if (pName.includes("CO2")) {
      grouped[bucketKey].co2_sum += val; grouped[bucketKey].co2_count++
    } else if (pName.includes("CO")) {
      grouped[bucketKey].co_sum += val; grouped[bucketKey].co_count++
    } else if (pName.includes("NH3")) {
      grouped[bucketKey].nh3_sum += val; grouped[bucketKey].nh3_count++
    } else if (pName.includes("TEMP")) {
      grouped[bucketKey].temp_sum += val; grouped[bucketKey].temp_count++
    } else if (pName.includes("HUM")) {
      grouped[bucketKey].hum_sum += val; grouped[bucketKey].hum_count++
    }

    if (item.pm25 !== undefined || item.pm2_5 !== undefined) {
      grouped[bucketKey].pm25_sum += Number(item.pm25 ?? item.pm2_5); grouped[bucketKey].pm25_count++
    }
    if (item.pm10 !== undefined) {
      grouped[bucketKey].pm10_sum += Number(item.pm10); grouped[bucketKey].pm10_count++
    }
    if (item.aqi !== undefined) {
      grouped[bucketKey].aqi_sum += Number(item.aqi); grouped[bucketKey].aqi_count++
    }
    if (item.no2 !== undefined) {
      grouped[bucketKey].no2_sum += Number(item.no2); grouped[bucketKey].no2_count++
    }
    if (item.so2 !== undefined) {
      grouped[bucketKey].so2_sum += Number(item.so2); grouped[bucketKey].so2_count++
    }
    if (item.co2 !== undefined) {
      grouped[bucketKey].co2_sum += Number(item.co2); grouped[bucketKey].co2_count++
    }
    if (item.temperature !== undefined || item.temp !== undefined) {
      grouped[bucketKey].temp_sum += Number(item.temperature ?? item.temp); grouped[bucketKey].temp_count++
    }
    if (item.humidity !== undefined || item.hum !== undefined) {
      grouped[bucketKey].hum_sum += Number(item.humidity ?? item.hum); grouped[bucketKey].hum_count++
    }
  })

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    return new Date(grouped[a].raw_date).getTime() - new Date(grouped[b].raw_date).getTime()
  })

  return sortedKeys.map((key) => {
    const g = grouped[key]
    const parsedDate = new Date(g.raw_date)

    let displayTime = parsedDate.toLocaleDateString([], { month: "short", day: "numeric", timeZone: "UTC" })
    if (period === "24hours") {
      displayTime = parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (period === "90days") {
      displayTime = `Week ${key.split("-W")[1] || ""}`
    }

    const avg = (sum: number, count: number) => (count > 0 ? Number((sum / count).toFixed(1)) : 0)
    const avgPM25 = avg(g.pm25_sum, g.pm25_count)
    const calculatedAQI = g.aqi_count > 0 ? Math.round(avg(g.aqi_sum, g.aqi_count)) : calculateAQIFromPM25(avgPM25)

    return {
      id: g.id,
      created_at: g.created_at,
      display_time: displayTime,
      aqi: calculatedAQI,
      pm25: avgPM25,
      pm10: avg(g.pm10_sum, g.pm10_count),
      no2: avg(g.no2_sum, g.no2_count),
      so2: avg(g.so2_sum, g.so2_count),
      co: avg(g.co_sum, g.co_count),
      nh3: avg(g.nh3_sum, g.nh3_count),
      co2: avg(g.co2_sum, g.co2_count),
      temperature: avg(g.temp_sum, g.temp_count),
      humidity: avg(g.hum_sum, g.hum_count),
    }
  })
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("7days")
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [rawTelemetry, setRawTelemetry] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      if (res.ok) {
        const result = await res.json()
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.readings)
          ? result.readings
          : []

        setRawTelemetry(list)
      } else {
        setRawTelemetry([])
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
      setRawTelemetry([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    fetchData()
  }, [period])

  const readings = useMemo(() => {
    return processDynamicReadings(rawTelemetry, period)
  }, [rawTelemetry, period])

  const validReadings = readings.filter((r) => r.pm25 > 0 || r.temperature > 0 || r.aqi > 0)
  const count = validReadings.length || 1

  const currentAQI = readings.length ? readings[readings.length - 1].aqi : 0
  const avgPM25Num = Number((validReadings.reduce((acc, r) => acc + (r.pm25 || 0), 0) / count).toFixed(1))
  const avgTempNum = Number((validReadings.reduce((acc, r) => acc + (r.temperature || 0), 0) / count).toFixed(1))
  const avgHumidityNum = Number((validReadings.reduce((acc, r) => acc + (r.humidity || 0), 0) / count).toFixed(1))

  const aqiStatus = getAQIStatus(currentAQI)
  const pm25Status = getPM25Status(avgPM25Num)

  const pollutantBreakdown = [
    { name: "PM2.5", value: avgPM25Num },
    { name: "PM10", value: Number((readings.reduce((a, b) => a + (b.pm10 || 0), 0) / count).toFixed(1)) },
    { name: "NO2", value: Number((readings.reduce((a, b) => a + (b.no2 || 0), 0) / count).toFixed(1)) },
    { name: "SO2", value: Number((readings.reduce((a, b) => a + (b.so2 || 0), 0) / count).toFixed(1)) },
    { name: "NH3", value: Number((readings.reduce((a, b) => a + (b.nh3 || 0), 0) / count).toFixed(1)) },
  ]

  const handleExport = () => {
    if (!readings.length) return
    const headers = ["Timestamp_ISO", "Display_Time", "AQI", "PM2.5", "PM10", "NO2", "SO2", "Temp_C", "Humidity_Pct"]
    const csvRows = [
      headers.join(","),
      ...readings.map((r) =>
        [
          `"${r.created_at}"`,
          `"${r.display_time || r.created_at}"`,
          r.aqi,
          r.pm25,
          r.pm10,
          r.no2,
          r.so2,
          r.temperature,
          r.humidity,
        ].join(",")
      ),
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `telemetry-analytics-${period}.csv`
    a.click()
  }

  if (!isMounted) return null

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden bg-background">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Telemetry Aggregates
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Clock className="h-3 w-3" />
                  {period === "24hours" ? "Hourly Rollups" : period === "7days" ? "Daily Rollups" : "Aggregated Trends"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Averaged concentration metrics grouped dynamically based on your selected timeframe
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={refreshing || loading}
                className="h-9 gap-2 text-xs font-medium border-border"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={loading || !readings.length}
                className="h-9 gap-2 text-xs font-medium border-border"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>

              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="h-9 w-[160px] border-border bg-background text-xs font-medium shadow-xs">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24hours">Last 24 hours</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest AQI</p>
                  <Activity className={`h-4 w-4 ${aqiStatus.color}`} />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className={`text-3xl font-black ${aqiStatus.color}`}>{currentAQI}</span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${aqiStatus.bg} ${aqiStatus.color}`}>
                    {aqiStatus.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Calculated EPA index</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg PM2.5</p>
                  <Wind className={`h-4 w-4 ${pm25Status.color}`} />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className={`text-3xl font-black ${pm25Status.color}`}>
                    {avgPM25Num} <span className="text-sm font-normal text-muted-foreground">µg/m³</span>
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${pm25Status.bg} ${pm25Status.color}`}>
                    {pm25Status.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Mean fine particulate level</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Temp</p>
                  <Thermometer className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {avgTempNum} <span className="text-sm font-normal text-muted-foreground">°C</span>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Ambient
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Mean ambient temperature</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Humidity</p>
                  <Droplets className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                    {avgHumidityNum} <span className="text-sm font-normal text-muted-foreground">%</span>
                  </span>
                  <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Relative
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Mean relative humidity</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border bg-card lg:col-span-2 shadow-xs">
              <CardHeader className="pb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {period === "24hours" ? "Hourly Quality Trends" : "Period Quality Trends"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Fluctuations in AQI, PM2.5, and PM10 averaged per timeframe
                  </CardDescription>
                </div>

                <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1">
                  {[
                    { label: "24H", value: "24hours" },
                    { label: "7D", value: "7days" },
                    { label: "30D", value: "30days" },
                    { label: "90D", value: "90days" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPeriod(option.value)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        period === option.value
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="display_time"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={20}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }} />
                        <Bar dataKey="aqi" name="AQI" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="pm25" name="PM2.5" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="pm10" name="PM10" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">Pollutant Distribution</CardTitle>
                <CardDescription className="text-xs">Overall average concentrations across selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pollutantBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="value" name="Avg Concentration" radius={[4, 4, 0, 0]}>
                          {pollutantBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={POLLUTANT_COLORS[entry.name] || "#3b82f6"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Telemetry Log Table */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">Telemetry Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Time Interval</th>
                        <th className="pb-3 font-semibold">AQI</th>
                        <th className="pb-3 font-semibold">PM2.5</th>
                        <th className="pb-3 font-semibold">PM10</th>
                        <th className="pb-3 font-semibold">NO2</th>
                        <th className="pb-3 font-semibold">SO2</th>
                        <th className="pb-3 font-semibold">CO2</th>
                        <th className="pb-3 font-semibold">Temp</th>
                        <th className="pb-3 font-semibold">Humidity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {readings.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-muted-foreground font-medium">
                            No telemetry records found for this timeframe.
                          </td>
                        </tr>
                      ) : (
                        readings.map((row) => (
                          <tr key={row.id} className="transition-colors hover:bg-muted/40">
                            <td className="py-3 font-semibold text-foreground">{row.display_time || row.created_at}</td>
                            <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">{row.aqi}</td>
                            <td className="py-3 text-muted-foreground">{row.pm25} µg/m³</td>
                            <td className="py-3 text-muted-foreground">{row.pm10} µg/m³</td>
                            <td className="py-3 text-muted-foreground">{row.no2} ppb</td>
                            <td className="py-3 text-muted-foreground">{row.so2} ppb</td>
                            <td className="py-3 text-muted-foreground">{row.co2 ?? 0} ppm</td>
                            <td className="py-3 text-muted-foreground">{row.temperature} °C</td>
                            <td className="py-3 text-muted-foreground">{row.humidity} %</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}