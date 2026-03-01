"use client"

import Link from "next/link"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RecentAlertsProps {
  alerts?: any[]
}

const iconMap = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const colorMap = {
  warning: "text-yellow-500 bg-yellow-500/10",
  info: "text-blue-500 bg-blue-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
}

export function RecentAlerts({ alerts = [] }: RecentAlertsProps) {
  // Map real database records directly
  const displayAlerts = alerts.map((alert, index) => {
    let alertType = alert.type || "info"
    if (alert.severity === "critical" || alert.severity === "warning") alertType = "warning"
    if (alert.severity === "resolved" || alert.severity === "good") alertType = "success"

    return {
      id: alert.id || index,
      type: alertType,
      message: alert.message || alert.description || "Air quality status updated",
      time: alert.created_at || alert.recorded_at
        ? new Date(alert.created_at || alert.recorded_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Recently",
    }
  })

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
        <Link 
          href="/dashboard/alerts" 
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      
      {displayAlerts.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No recent active alerts from database.
        </div>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((alert) => {
            const Icon = iconMap[alert.type as keyof typeof iconMap] || Info
            const colors = colorMap[alert.type as keyof typeof colorMap] || colorMap.info
            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3"
              >
                <div className={cn("rounded-full p-2", colors)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}