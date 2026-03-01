"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const data = [
  { name: "PM2.5", value: 35, limit: 35 },
  { name: "PM10", value: 68, limit: 150 },
  { name: "O3", value: 42, limit: 100 },
  { name: "NO2", value: 28, limit: 100 },
  { name: "SO2", value: 12, limit: 75 },
  { name: "CO", value: 2.1, limit: 9 },
]

export function PollutantsBarChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pollutant Levels</h3>
          <p className="text-sm text-muted-foreground">Current concentrations vs limits</p>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.005 260)" vertical={false} />
            <XAxis 
              dataKey="name" 
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
              labelStyle={{ color: "oklch(0.65 0 0)" }}
            />
            <Bar 
              dataKey="value" 
              fill="oklch(0.7 0.15 165)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
