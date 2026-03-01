"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { AQICard } from "@/components/dashboard/aqi-card"
import { PollutantCard } from "@/components/dashboard/pollutant-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { AQITrendChart } from "@/components/dashboard/aqi-trend-chart"
import { PollutantsBarChart } from "@/components/dashboard/pollutants-bar-chart"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { MapPin, Activity, AlertTriangle, Clock } from "lucide-react"

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard/overview")
        if (!response.ok) throw new Error("Failed to fetch data")
        const result = await response.json()
        setData(result.data)
      } catch (err) {
        console.error("[v0] Dashboard fetch error:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <>
        <Header
          title="Overview"
          description="Real-time air quality monitoring for Kigali, Rwanda"
        />
        <div className="flex-1 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-7xl">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <Header
          title="Overview"
          description="Real-time air quality monitoring for Kigali, Rwanda"
        />
        <div className="flex-1 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-7xl">
            <p className="text-red-500">{error || "Failed to load data"}</p>
          </div>
        </div>
      </>
    )
  }
  return (
    <>
      <Header
        title="Overview"
        description="Real-time air quality monitoring for Kigali, Rwanda"
      />
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Stations"
              value={data.stationStats.online}
              change={`${data.stationStats.offline} offline`}
              changeType={data.stationStats.offline > 0 ? "negative" : "positive"}
              icon={MapPin}
            />
            <StatCard
              title="Current AQI"
              value={data.currentAQI?.aqi_value || "N/A"}
              change={data.currentAQI?.status || "Unknown"}
              changeType="neutral"
              icon={Activity}
            />
            <StatCard
              title="Active Alerts"
              value={data.recentAlerts.length}
              change={`${data.recentAlerts.filter(a => !a.acknowledged).length} unacknowledged`}
              changeType={data.recentAlerts.length > 0 ? "negative" : "positive"}
              icon={AlertTriangle}
            />
            <StatCard
              title="Last Updated"
              value={data.currentAQI?.recorded_at ? new Date(data.currentAQI.recorded_at).toLocaleTimeString() : "N/A"}
              change="Real-time monitoring"
              changeType="neutral"
              icon={Clock}
            />
          </div>

          {/* AQI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.currentAQI && (
              <AQICard
                value={data.currentAQI.aqi_value}
                label="Current AQI"
                location={data.currentAQI.district || "Kigali"}
                trend="stable"
              />
            )}
            {data.recentAlerts.length > 0 && (
              <AQICard
                value={data.recentAlerts[0]?.severity === "critical" ? 150 : 100}
                label="Alert Status"
                location="Active Alert"
              />
            )}
            <AQICard
              value={Math.round(data.trendData.reduce((a: any, b: any) => a + b.concentration_value, 0) / Math.max(data.trendData.length, 1))}
              label="Average Level"
              location="All Stations"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AQITrendChart />
            <PollutantsBarChart />
          </div>

          {/* Pollutants & Alerts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Pollutant Breakdown
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.trendData && data.trendData.slice(0, 6).map((pollutant: any) => (
                    <PollutantCard
                      key={pollutant.id}
                      name={pollutant.pollutant_name || "Pollutant"}
                      value={pollutant.concentration_value || 0}
                      unit={pollutant.unit || "µg/m³"}
                      status={(pollutant.concentration_value < 50 ? "good" : pollutant.concentration_value < 100 ? "moderate" : "unhealthy") as any}
                      description={pollutant.description || ""}
                    />
                  ))}
                </div>
              </div>
            </div>
            <RecentAlerts />
          </div>
        </div>
      </div>
    </>
  )
}
