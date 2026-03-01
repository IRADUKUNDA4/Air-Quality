"use client"

import { useState, useEffect } from "react"
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
  Sparkles,
} from "lucide-react"

interface Reading {
  id: string
  created_at: string
  display_time: string
  aqi: number
  pm25: number
  pm10: number
  no2: number
  so2: number
  co: number
  nh3: number
  co2: number
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("30days")
  const [loading, setLoading] = useState<boolean>(true)
  const [readings, setReadings] = useState<Reading[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?period=${period}`)
        if (res.ok) {
          const result = await res.json()
          setReadings(Array.isArray(result) ? result : [])
        } else {
          setReadings([])
        }
      } catch (err) {
        console.error("Failed to load telemetry:", err)
        setReadings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  const formatXAxisTick = (timeStr: string) => {
    if (!timeStr) return ""
    const date = new Date(timeStr)
    if (isNaN(date.getTime())) return timeStr

    if (period === "24hours") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const validReadings = readings.filter((r) => r.pm25 > 0 || r.temperature > 0 || r.aqi > 0)
  const count = validReadings.length || 1

  const currentAQI = readings.length ? readings[readings.length - 1].aqi : 0
  const avgPM25 = (validReadings.reduce((acc, r) => acc + (r.pm25 || 0), 0) / count).toFixed(1)
  const avgTemp = (validReadings.reduce((acc, r) => acc + (r.temperature || 0), 0) / count).toFixed(1)
  const avgHumidity = (validReadings.reduce((acc, r) => acc + (r.humidity || 0), 0) / count).toFixed(1)

  const pollutantBreakdown = [
    { name: "PM2.5", value: Number((readings.reduce((a, b) => a + (b.pm25 || 0), 0) / count).toFixed(1)) },
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
          `"${r.display_time}"`,
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
    a.download = `telemetry-export-${period}.csv`
    a.click()
  }

  if (!isMounted) return null

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden bg-background">
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Cleaned Banner Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Analytics & Sensor Telemetry
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="h-3 w-3" /> Historical Logs
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Detailed pollutant breakdown and environmental trends collected across active stations
              </p>
            </div>

            <div className="flex items-center gap-3">
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

          {/* Key Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current AQI</p>
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-foreground">{currentAQI}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Latest real-time station index</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg PM2.5</p>
                  <Wind className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-foreground">
                    {avgPM25} <span className="text-sm font-normal text-muted-foreground">µg/m³</span>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Fine particulate matter level</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Temp</p>
                  <Thermometer className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-foreground">
                    {avgTemp} <span className="text-sm font-normal text-muted-foreground">°C</span>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Ambient environment temperature</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Humidity</p>
                  <Droplets className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-foreground">
                    {avgHumidity} <span className="text-sm font-normal text-muted-foreground">%</span>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Relative atmospheric humidity</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-border bg-card lg:col-span-2 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-foreground">Air Quality Trends</CardTitle>
                <CardDescription className="text-xs">
                  Comparative fluctuations in AQI, PM2.5, and PM10 across selected time window
                </CardDescription>
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
                          dataKey="created_at"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatXAxisTick}
                          minTickGap={25}
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
                <CardTitle className="text-base font-bold text-foreground">Pollutant Breakdown</CardTitle>
                <CardDescription className="text-xs">Mean concentrations per gas & particulate parameter</CardDescription>
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
                        <Bar dataKey="value" name="Concentration" radius={[4, 4, 0, 0]}>
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

          {/* Telemetry Data Records Table */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold text-foreground">Telemetry Data Records</CardTitle>
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
                        <th className="pb-3 font-semibold">Timestamp</th>
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
                            <td className="py-3 text-muted-foreground">{row.co2} ppm</td>
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