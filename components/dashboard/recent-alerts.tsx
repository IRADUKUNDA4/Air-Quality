"use client"

import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const alerts = [
  {
    id: 1,
    type: "warning",
    message: "PM2.5 levels elevated in Nyarugenge District",
    time: "10 minutes ago",
  },
  {
    id: 2,
    type: "info",
    message: "New monitoring station online: Kicukiro",
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "success",
    message: "Air quality improved in Gasabo District",
    time: "2 hours ago",
  },
  {
    id: 4,
    type: "warning",
    message: "Ozone levels approaching moderate threshold",
    time: "3 hours ago",
  },
  {
    id: 5,
    type: "info",
    message: "Weekly air quality report available",
    time: "5 hours ago",
  },
]

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

export function RecentAlerts() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
        <button className="text-sm text-primary hover:underline">View all</button>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type as keyof typeof iconMap]
          const colors = colorMap[alert.type as keyof typeof colorMap]
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
    </div>
  )
}
