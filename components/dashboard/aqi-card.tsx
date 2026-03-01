"use client"

import { cn } from "@/lib/utils"

interface AQICardProps {
  value: number
  label: string
  location?: string
  unit?: string
  trend?: "up" | "down" | "stable"
  trendValue?: string
}

function getAQILevel(value: number, unit: string) {
  // Handle non-AQI metrics like alert counts
  if (unit !== "AQI") {
    return {
      level: "Normal",
      badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      textColor: "text-foreground",
    }
  }

  // AQI thresholds
  if (value <= 50) {
    return {
      level: "Good",
      badgeStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      textColor: "text-emerald-600 dark:text-emerald-400",
    }
  }
  if (value <= 100) {
    return {
      level: "Moderate",
      badgeStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      textColor: "text-amber-600 dark:text-amber-400",
    }
  }
  if (value <= 150) {
    return {
      level: "Unhealthy (SG)",
      badgeStyle: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      textColor: "text-orange-600 dark:text-orange-400",
    }
  }
  if (value <= 200) {
    return {
      level: "Unhealthy",
      badgeStyle: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      textColor: "text-red-600 dark:text-red-400",
    }
  }
  if (value <= 300) {
    return {
      level: "Very Unhealthy",
      badgeStyle: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      textColor: "text-purple-600 dark:text-purple-400",
    }
  }
  return {
    level: "Hazardous",
    badgeStyle: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    textColor: "text-rose-600 dark:text-rose-400",
  }
}

export function AQICard({
  value,
  label,
  location,
  unit = "AQI",
  trend,
  trendValue,
}: AQICardProps) {
  // Format long decimals to clean integers or 1 decimal place
  const formattedValue = typeof value === "number"
    ? (Number.isInteger(value) ? value : value.toFixed(1))
    : 0

  const { level, badgeStyle, textColor } = getAQILevel(value, unit)

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {location && (
            <p className="mt-0.5 text-xs text-muted-foreground/80">{location}</p>
          )}
        </div>
        <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold", badgeStyle)}>
          {level}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className={cn("text-3xl font-extrabold tracking-tight", textColor)}>
          {formattedValue}
        </span>
        <span className="text-xs font-bold text-muted-foreground">{unit}</span>
      </div>

      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          <span
            className={cn(
              trend === "up" && "text-rose-500",
              trend === "down" && "text-emerald-500",
              trend === "stable" && "text-muted-foreground"
            )}
          >
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </span>
          <span className="text-muted-foreground">from yesterday</span>
        </div>
      )}
    </div>
  )
}