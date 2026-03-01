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

export interface AQITrendChartProps {
  data?: any[]
}

export function AQITrendChart({ data = [] }: AQITrendChartProps) {
  // Use pre-formatted hourly labels directly; fall back safely if necessary
  const chartData = data.map((item) => {
    let displayTime = item.time || "--:--"

    // Re-format only if a raw date string is passed without a formatted `time` key
    if (!item.time && item.recorded_at) {
      const cleanDateStr = String(item.recorded_at).trim().replace(" ", "T")
      const parsedDate = new Date(cleanDateStr)
      if (!isNaN(parsedDate.getTime())) {
        displayTime = parsedDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      }
    }

    return {
      time: displayTime,
      aqi: item.aqi ?? item.concentration_value ?? item.aqi_value ?? 0,
    }
  })

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AQI Trend</h3>
          <p className="text-sm text-muted-foreground">Live Hourly Progression</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">AQI Level</span>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No sensor trend data recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="time" 
                stroke="#888888" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background, #1f2937)",
                  border: "1px solid var(--border, #374151)",
                  borderRadius: "8px",
                  color: "var(--foreground, #ffffff)",
                }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#aqiGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}