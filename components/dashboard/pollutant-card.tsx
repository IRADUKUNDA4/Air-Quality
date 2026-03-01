"use client"

import { cn } from "@/lib/utils"

interface PollutantCardProps {
  name: string
  value: number
  unit: string
  status: "good" | "moderate" | "unhealthy" | "very-unhealthy" | "hazardous"
  description?: string
}

const statusConfig = {
  good: { label: "Good", color: "bg-emerald-500" },
  moderate: { label: "Moderate", color: "bg-yellow-500" },
  unhealthy: { label: "Unhealthy", color: "bg-red-500" },
  "very-unhealthy": { label: "Very Unhealthy", color: "bg-purple-500" },
  hazardous: { label: "Hazardous", color: "bg-rose-900" },
}

export function PollutantCard({ name, value, unit, status, description }: PollutantCardProps) {
  const config = statusConfig[status]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{name}</h3>
        <div className={cn("h-2 w-2 rounded-full", config.color)} />
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {description && (
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <div className={cn("h-1 flex-1 rounded-full bg-secondary")}>
          <div 
            className={cn("h-full rounded-full", config.color)}
            style={{ width: `${Math.min((value / 500) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
    </div>
  )
}
