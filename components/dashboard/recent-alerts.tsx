"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle, Info, Check, Loader2 } from "lucide-react"
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
  warning: "text-amber-500 bg-amber-500/10",
  info: "text-blue-500 bg-blue-500/10",
  success: "text-emerald-500 bg-emerald-500/10",
}

const formatTimeAgo = (rawDate: any): string => {
  if (!rawDate) return "Recently"
  const formattedString = String(rawDate).trim().replace(" ", "T")
  const date = new Date(formattedString)
  if (isNaN(date.getTime())) return "Recently"

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 30) return "Just now"
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`

  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

const checkIsUnread = (alert: any): boolean => {
  if (typeof alert.is_read === "boolean") return !alert.is_read
  if (typeof alert.read === "boolean") return !alert.read
  if (typeof alert.isRead === "boolean") return !alert.isRead
  if (typeof alert.acknowledged === "boolean") return !alert.acknowledged
  if (typeof alert.status === "string") {
    const statusLower = alert.status.toLowerCase()
    return statusLower !== "read" && statusLower !== "acknowledged"
  }
  return true
}

export function RecentAlerts({ alerts = [] }: RecentAlertsProps) {
  const [acknowledgedKeySet, setAcknowledgedKeySet] = useState<Set<string | number>>(new Set())
  const [loadingKeySet, setLoadingKeySet] = useState<Set<string | number>>(new Set())

  const handleAcknowledge = async (originalAlert: any, itemKey: string | number) => {
    // Optimistically update local UI state
    setAcknowledgedKeySet((prev) => new Set(prev).add(itemKey))
    setLoadingKeySet((prev) => new Set(prev).add(itemKey))

    try {
      // Determine unique ID or query parameter
      const alertId = originalAlert.id ?? originalAlert.created_at ?? originalAlert.message

      if (!alertId) {
        console.warn("Alert row lacks an identifying 'id', 'created_at', or 'message' field:", originalAlert)
        return
      }

      // Perform network update via Next.js API Route instead of direct client-side Supabase connection
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: originalAlert.id,
          acknowledged: true,
          is_read: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Alert successfully marked as read via API route:", result)
    } catch (err: any) {
      console.error("Alert Update Error:", err?.message || err)

      // Roll back optimistic state on failure
      setAcknowledgedKeySet((prev) => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    } finally {
      setLoadingKeySet((prev) => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    }
  }

  const displayAlerts = alerts.map((alert, index) => {
    // Combine primary key with index to guarantee absolute uniqueness in React render tree
    const uniqueKey =
      alert.id !== undefined && alert.id !== null
        ? `alert-${alert.id}-${index}`
        : `alert-index-${index}`

    let alertType = alert.type || "info"
    if (alert.severity === "critical" || alert.severity === "warning") alertType = "warning"
    if (alert.severity === "resolved" || alert.severity === "good") alertType = "success"

    const isUnread = acknowledgedKeySet.has(uniqueKey) ? false : checkIsUnread(alert)

    return {
      key: uniqueKey,
      rawAlert: alert,
      type: alertType,
      isUnread,
      message: alert.message || alert.description || alert.title || "Air quality status updated",
      timeAgo: formatTimeAgo(alert.created_at || alert.recorded_at),
    }
  })

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-normal text-foreground">Recent Alerts</h3>
        <Link
          href="/dashboard/alerts"
          className="text-sm font-normal text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {displayAlerts.length === 0 ? (
        <div className="py-8 text-center text-sm font-normal text-muted-foreground">
          No recent active alerts from database.
        </div>
      ) : (
        <div className="space-y-3">
          {displayAlerts.map((item) => {
            const Icon = iconMap[item.type as keyof typeof iconMap] || Info
            const colors = colorMap[item.type as keyof typeof colorMap] || colorMap.info
            const isLoading = loadingKeySet.has(item.key)

            return (
              <div
                key={item.key}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3.5 transition-all",
                  item.isUnread
                    ? "border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20"
                    : "border-border bg-background"
                )}
              >
                <div className={cn("mt-0.5 shrink-0 rounded-full p-2", colors)}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-1 items-start gap-1.5">
                      {item.isUnread && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                      )}
                      <p className="whitespace-pre-wrap text-sm font-normal leading-snug text-foreground break-words">
                        {item.message}
                      </p>
                    </div>

                    {item.isUnread ? (
                      <button
                        onClick={() => handleAcknowledge(item.rawAlert, item.key)}
                        disabled={isLoading}
                        title="Acknowledge & Mark as Read"
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-1 text-[11px] font-normal uppercase text-emerald-700 transition-all hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50 dark:text-emerald-400"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        <span>Ack</span>
                      </button>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-normal uppercase text-muted-foreground">
                        <Check className="h-3 w-3" />
                        Acknowledged
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs font-normal text-muted-foreground">
                    {item.timeAgo}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}