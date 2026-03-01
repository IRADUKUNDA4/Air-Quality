"use client"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

const monthlyData = [
  { month: "Jan", aqi: 65, pm25: 28, pm10: 52 },
  { month: "Feb", aqi: 58, pm25: 24, pm10: 48 },
  { month: "Mar", aqi: 72, pm25: 32, pm10: 58 },
  { month: "Apr", aqi: 85, pm25: 38, pm10: 72 },
  { month: "May", aqi: 78, pm25: 35, pm10: 65 },
  { month: "Jun", aqi: 68, pm25: 30, pm10: 55 },
  { month: "Jul", aqi: 62, pm25: 26, pm10: 50 },
  { month: "Aug", aqi: 55, pm25: 22, pm10: 45 },
  { month: "Sep", aqi: 70, pm25: 31, pm10: 58 },
  { month: "Oct", aqi: 82, pm25: 36, pm10: 68 },
  { month: "Nov", aqi: 75, pm25: 33, pm10: 62 },
  { month: "Dec", aqi: 68, pm25: 29, pm10: 54 },
]

const weeklyComparison = [
  { day: "Mon", thisWeek: 72, lastWeek: 68 },
  { day: "Tue", thisWeek: 68, lastWeek: 75 },
  { day: "Wed", thisWeek: 82, lastWeek: 70 },
  { day: "Thu", thisWeek: 75, lastWeek: 72 },
  { day: "Fri", thisWeek: 88, lastWeek: 78 },
  { day: "Sat", thisWeek: 65, lastWeek: 62 },
  { day: "Sun", thisWeek: 58, lastWeek: 55 },
]

const districtData = [
  { district: "Nyarugenge", aqi: 82 },
  { district: "Gasabo", aqi: 65 },
  { district: "Kicukiro", aqi: 58 },
  { district: "Bugesera", aqi: 48 },
  { district: "Rwamagana", aqi: 42 },
]

const stats = [
  { label: "Average AQI (30 days)", value: "68", change: "-5% vs last month" },
  { label: "Days with Good AQI", value: "18", change: "+3 vs last month" },
  { label: "Peak AQI Recorded", value: "125", change: "Oct 15, 2025" },
  { label: "Most Affected Pollutant", value: "PM2.5", change: "48% of readings" },
]

export default function AnalyticsPage() {
  return (
    <>
      <Header
        title="Analytics"
        description="Historical air quality trends and analysis"
      />
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select defaultValue="30days">
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                <SelectItem value="nyarugenge">Nyarugenge</SelectItem>
                <SelectItem value="gasabo">Gasabo</SelectItem>
                <SelectItem value="kicukiro">Kicukiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Trend Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Monthly AQI Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.005 260)" />
                    <XAxis
                      dataKey="month"
                      stroke="oklch(0.65 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.65 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.005 260)",
                        border: "1px solid oklch(0.25 0.005 260)",
                        borderRadius: "8px",
                        color: "oklch(0.95 0 0)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="aqi"
                      name="AQI"
                      stroke="oklch(0.7 0.15 165)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.7 0.15 165)", strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pm25"
                      name="PM2.5"
                      stroke="oklch(0.65 0.18 250)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.65 0.18 250)", strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pm10"
                      name="PM10"
                      stroke="oklch(0.75 0.15 85)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(0.75 0.15 85)", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Comparison */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Weekly Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.005 260)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="oklch(0.65 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="oklch(0.65 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.005 260)",
                          border: "1px solid oklch(0.25 0.005 260)",
                          borderRadius: "8px",
                          color: "oklch(0.95 0 0)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="thisWeek" name="This Week" fill="oklch(0.7 0.15 165)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="lastWeek" name="Last Week" fill="oklch(0.25 0.005 260)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* District Comparison */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">AQI by District</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtData} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.005 260)" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="oklch(0.65 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        dataKey="district"
                        type="category"
                        stroke="oklch(0.65 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.005 260)",
                          border: "1px solid oklch(0.25 0.005 260)",
                          borderRadius: "8px",
                          color: "oklch(0.95 0 0)",
                        }}
                      />
                      <Bar dataKey="aqi" name="AQI" fill="oklch(0.7 0.15 165)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Month</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Avg AQI</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">PM2.5</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">PM10</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row) => (
                      <tr key={row.month} className="border-b border-border/50">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{row.month}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{row.aqi}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{row.pm25} µg/m³</td>
                        <td className="px-4 py-3 text-sm text-foreground">{row.pm10} µg/m³</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            row.aqi <= 50 ? "bg-aqi-good/20 text-aqi-good" :
                            row.aqi <= 100 ? "bg-aqi-moderate/20 text-aqi-moderate" :
                            "bg-aqi-unhealthy/20 text-aqi-unhealthy"
                          }`}>
                            {row.aqi <= 50 ? "Good" : row.aqi <= 100 ? "Moderate" : "Unhealthy"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
