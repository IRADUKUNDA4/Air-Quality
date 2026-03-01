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
import { cn } from "@/lib/utils"

interface PollutantDetailChartProps {
  pollutant: {
    name: string
    fullName: string
    value: number
    unit: string
    limit: number
    description: string
    healthEffects: string
    sources: string[]
    data: Array<{ time: string; value: number }>
  }
}

function getStatusFromValue(value: number, limit: number) {
  const ratio = value / limit
  if (ratio <= 0.5) return { status: "Good", color: "bg-emerald-500", textColor: "text-emerald-500" }
  if (ratio <= 0.75) return { status: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-500" }
  if (ratio <= 1) return { status: "Unhealthy for Sensitive", color: "bg-orange-500", textColor: "text-orange-500" }
  return { status: "Unhealthy", color: "bg-red-500", textColor: "text-red-500" }
}

export function PollutantDetailChart({ pollutant }: PollutantDetailChartProps) {
  const { status, color, textColor } = getStatusFromValue(pollutant.value, pollutant.limit)
  const percentage = Math.min((pollutant.value / pollutant.limit) * 100, 100)

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{pollutant.name}</h3>
            <p className="text-sm text-muted-foreground">{pollutant.fullName}</p>
          </div>
          <div className={cn("rounded-full px-3 py-1 text-sm font-medium text-white", color)}>
            {status}
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className={cn("text-4xl font-bold", textColor)}>{pollutant.value}</span>
          <span className="text-lg text-muted-foreground">{pollutant.unit}</span>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Safety Limit: {pollutant.limit} {pollutant.unit}</span>
            <span className="text-muted-foreground">{percentage.toFixed(0)}% of limit</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", color)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <h4 className="mb-4 text-sm font-medium text-foreground">24-Hour Trend</h4>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={pollutant.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${pollutant.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.7 0.15 165)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.7 0.15 165)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.005 260)" />
              <XAxis
                dataKey="time"
                stroke="oklch(0.65 0 0)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="oklch(0.65 0 0)"
                fontSize={11}
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.7 0.15 165)"
                strokeWidth={2}
                fill={`url(#gradient-${pollutant.name})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-border p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-foreground">Health Effects</h4>
            <p className="mt-1 text-sm text-muted-foreground">{pollutant.healthEffects}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Primary Sources</h4>
            <ul className="mt-1 space-y-1">
              {pollutant.sources.map((source) => (
                <li key={source} className="text-sm text-muted-foreground">
                  • {source}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
