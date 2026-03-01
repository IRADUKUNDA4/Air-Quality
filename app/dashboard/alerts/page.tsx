"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Bell,
  Clock,
  MapPin,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Check,
} from "lucide-react"
import { supabase } from "@/lib/supabase"

export interface AlertRecord {
  id: number | string
  title?: string
  message?: string
  description?: string
  type?: "critical" | "warning" | "info" | "success"
  severity?: string
  alert_type?: string
  station?: string
  station_name?: string
  district?: string
  location?: string
  acknowledged?: boolean
  is_read?: boolean
  created_at?: string
  recorded_at?: string
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently"
  const formattedString = String(dateString).trim().replace(" ", "T")
  const date = new Date(formattedString)
  if (isNaN(date.getTime())) return "Recently"

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getNormalizedSeverity(alert: AlertRecord): "critical" | "warning" | "info" | "success" {
  const level = (alert.severity || alert.type || alert.alert_type || "info").toLowerCase()
  if (level.includes("critical") || level.includes("high") || level === "error") return "critical"
  if (level.includes("warn") || level.includes("moderate")) return "warning"
  if (level.includes("success") || level.includes("resolved") || level.includes("good")) return "success"
  return "info"
}

const alertConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    badgeColor: "bg-red-500 text-white dark:bg-red-600",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    badgeColor: "bg-amber-500 text-white dark:bg-amber-600",
  },
  info: {
    icon: Info,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    badgeColor: "bg-blue-500 text-white dark:bg-blue-600",
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    badgeColor: "bg-emerald-500 text-white dark:bg-emerald-600",
  },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setAlerts(data as AlertRecord[])
      } else {
        console.error("Error fetching database alerts:", error)
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAlerts()

    const channel = supabase
      .channel("alerts_page_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => loadAlerts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadAlerts])

  const handleAcknowledge = async (id: number | string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true, is_read: true } : a))
    )
    await supabase
      .from("alerts")
      .update({ acknowledged: true, is_read: true })
      .eq("id", id)
  }

  const handleDismiss = async (id: number | string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    await supabase.from("alerts").delete().eq("id", id)
  }

  const handleMarkAllRead = async () => {
    const unackIds = alerts.filter((a) => !a.acknowledged && !a.is_read).map((a) => a.id)
    if (unackIds.length === 0) return

    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true, is_read: true })))

    await supabase
      .from("alerts")
      .update({ acknowledged: true, is_read: true })
      .in("id", unackIds)
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged && !a.is_read)
  const criticalAlerts = alerts.filter((a) => getNormalizedSeverity(a) === "critical")

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full bg-background p-2 sm:p-3 lg:p-4 space-y-3">
      {/* Page Header */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-foreground">Live Air Quality Alerts</h1>
          <p className="text-[11px] text-muted-foreground">
            Real-time threshold events synced directly from Supabase
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unacknowledged.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 px-2 text-xs gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadAlerts}
            disabled={loading}
            className="h-7 px-2 text-xs gap-1.5"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Sync
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid gap-2 grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-2.5 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 shrink-0">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-foreground">
                {criticalAlerts.length}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Critical
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-2.5 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 shrink-0">
              <Bell className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-foreground">
                {unacknowledged.length}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Pending
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="flex items-center gap-2.5 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 shrink-0">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-foreground">
                {alerts.filter((a) => a.acknowledged || a.is_read).length}
              </p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Acknowledged
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Feed Container */}
      <Card className="border-border bg-card">
        <CardContent className="p-3">
          {loading && alerts.length === 0 ? (
            <div className="flex h-28 items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Fetching database alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-md text-muted-foreground text-xs">
              No active alerts reported in the database.
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-2.5 h-8 bg-muted/60 p-0.5">
                <TabsTrigger value="all" className="h-7 text-xs px-2.5">
                  All ({alerts.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="h-7 text-xs px-2.5">
                  Pending ({unacknowledged.length})
                </TabsTrigger>
                <TabsTrigger value="critical" className="h-7 text-xs px-2.5">
                  Critical ({criticalAlerts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-1.5 mt-0">
                {alerts.map((a) => (
                  <CompactAlertCard
                    key={a.id}
                    alert={a}
                    onAck={handleAcknowledge}
                    onDismiss={handleDismiss}
                  />
                ))}
              </TabsContent>

              <TabsContent value="unread" className="space-y-1.5 mt-0">
                {unacknowledged.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                    No pending alerts! All clear.
                  </div>
                ) : (
                  unacknowledged.map((a) => (
                    <CompactAlertCard
                      key={a.id}
                      alert={a}
                      onAck={handleAcknowledge}
                      onDismiss={handleDismiss}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="critical" className="space-y-1.5 mt-0">
                {criticalAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-md">
                    No critical events recorded.
                  </div>
                ) : (
                  criticalAlerts.map((a) => (
                    <CompactAlertCard
                      key={a.id}
                      alert={a}
                      onAck={handleAcknowledge}
                      onDismiss={handleDismiss}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CompactAlertCard({
  alert,
  onAck,
  onDismiss,
}: {
  alert: AlertRecord
  onAck: (id: number | string) => void
  onDismiss: (id: number | string) => void
}) {
  const severityKey = getNormalizedSeverity(alert)
  const cfg = alertConfig[severityKey]
  const Icon = cfg.icon

  const title =
    alert.title || alert.message || alert.alert_type || "Air Quality Threshold Triggered"
  const detailMessage =
    alert.description ||
    (alert.title && alert.message !== alert.title ? alert.message : null)
  const isAck = alert.acknowledged || alert.is_read
  const location = alert.district || alert.station || alert.station_name || alert.location || "System Sensor"
  const timestamp = alert.created_at || alert.recorded_at

  return (
    <div
      className={cn(
        "rounded-md border px-2.5 py-2 transition-all",
        cfg.bgColor,
        isAck && "opacity-60 grayscale-[20%] bg-muted/20 border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2 min-w-0">
          <Icon className={cn("h-4 w-4 shrink-0 mt-0.5 sm:mt-0", cfg.color)} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <h4 className="text-xs font-semibold text-foreground truncate">{title}</h4>
              <Badge
                className={cn(
                  "text-[9px] px-1 py-0 h-4 font-medium uppercase shrink-0",
                  cfg.badgeColor
                )}
              >
                {severityKey}
              </Badge>
            </div>
            {detailMessage && (
              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {detailMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5 truncate max-w-[120px]">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!isAck && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAck(alert.id)}
                className="h-6 px-2 text-[10px] bg-background hover:bg-emerald-500/10 hover:text-emerald-600 border-border"
              >
                Ack
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDismiss(alert.id)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}