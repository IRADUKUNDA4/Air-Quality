"use client"

import { cn } from "@/lib/utils"

interface AQICardProps {
  value: number
  label: string
  location?: string
  trend?: "up" | "down" | "stable"
  trendValue?: string
}

function getAQILevel(value: number) {
  if (value <= 50) return { level: "Good", color: "bg-emerald-500", textColor: "text-emerald-500" }
  if (value <= 100) return { level: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-500" }
  if (value <= 150) return { level: "Unhealthy for Sensitive Groups", color: "bg-orange-500", textColor: "text-orange-500" }
  if (value <= 200) return { level: "Unhealthy", color: "bg-red-500", textColor: "text-red-500" }
  if (value <= 300) return { level: "Very Unhealthy", color: "bg-purple-500", textColor: "text-purple-500" }
  return { level: "Hazardous", color: "bg-rose-900", textColor: "text-rose-900" }
}

export function AQICard({ value, label, location, trend, trendValue }: AQICardProps) {
  const { level, color, textColor } = getAQILevel(value)

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {location && (
            <p className="text-xs text-muted-foreground/70">{location}</p>
          )}
        </div>
        <div className={cn("rounded-full px-2.5 py-1 text-xs font-medium text-white", color)}>
          {level}
        </div>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className={cn("text-4xl font-bold", textColor)}>{value}</span>
        <span className="mb-1 text-sm text-muted-foreground">AQI</span>
      </div>
      {trend && trendValue && (
        <div className="mt-2 flex items-center gap-1 text-sm">
          <span className={cn(
            trend === "up" && "text-red-500",
            trend === "down" && "text-emerald-500",
            trend === "stable" && "text-muted-foreground"
          )}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
          <span className="text-muted-foreground">from yesterday</span>
        </div>
      )}
    </div>
  )
}
