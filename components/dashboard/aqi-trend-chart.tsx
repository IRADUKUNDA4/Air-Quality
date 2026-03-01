"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const data = [
  { time: "00:00", aqi: 45 },
  { time: "02:00", aqi: 42 },
  { time: "04:00", aqi: 38 },
  { time: "06:00", aqi: 52 },
  { time: "08:00", aqi: 78 },
  { time: "10:00", aqi: 95 },
  { time: "12:00", aqi: 88 },
  { time: "14:00", aqi: 82 },
  { time: "16:00", aqi: 76 },
  { time: "18:00", aqi: 85 },
  { time: "20:00", aqi: 72 },
  { time: "22:00", aqi: 58 },
]

export function AQITrendChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AQI Trend</h3>
          <p className="text-sm text-muted-foreground">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">AQI Value</span>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.7 0.15 165)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.7 0.15 165)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.005 260)" />
            <XAxis 
              dataKey="time" 
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
              domain={[0, 150]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "oklch(0.17 0.005 260)",
                border: "1px solid oklch(0.25 0.005 260)",
                borderRadius: "8px",
                color: "oklch(0.95 0 0)",
              }}
              labelStyle={{ color: "oklch(0.65 0 0)" }}
            />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke="oklch(0.7 0.15 165)"
              strokeWidth={2}
              fill="url(#aqiGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
