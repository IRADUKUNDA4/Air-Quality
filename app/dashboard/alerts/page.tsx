"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, Info, Bell, Clock, MapPin, X, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

export interface AlertRecord {
  id: number | string
  type: "critical" | "warning" | "info" | "success"
  title: string
  message: string
  station: string
  acknowledged: boolean
  created_at: string
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const alertConfig = {
  critical: { icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", badgeColor: "bg-red-500 text-white" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", badgeColor: "bg-amber-500 text-white" },
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", badgeColor: "bg-blue-500 text-white" },
  success: { icon: CheckCircle, color: "text-emerald-500", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", badgeColor: "bg-emerald-500 text-white" },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("alerts").select("*").order("created_at", { ascending: false })
    if (!error && data) setAlerts(data as AlertRecord[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAlerts()
    const subscription = supabase
      .channel("live_alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => loadAlerts())
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [loadAlerts])

  const handleAcknowledge = async (id: number | string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
    await supabase.from("alerts").update({ acknowledged: true }).eq("id", id)
  }

  const handleDismiss = async (id: number | string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    await supabase.from("alerts").delete().eq("id", id)
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged)
  const critical = alerts.filter((a) => a.type === "critical" && !a.acknowledged)

  return (
    <div className="flex flex-1 flex-col min-w-0 max-w-full bg-background p-2 sm:p-3 lg:p-4 space-y-3">
      {/* Tight Header */}
      <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-foreground">Air Quality Alerts</h1>
          <p className="text-[11px] text-muted-foreground">Real-time sensor threshold events</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAlerts} disabled={loading} className="h-7 px-2 text-xs gap-1.5">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Sync
        </Button>
      </div>

      {/* Low-profile Compact Metric Grid */}
      <div className="grid gap-2 grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-2.5 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500/10 shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-foreground">{critical.length}</p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">Critical</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-2.5 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 shrink-0">
              <Bell className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-foreground">{unacknowledged.length}</p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-2.5 p-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 shrink-0">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-foreground">{alerts.filter((a) => a.acknowledged).length}</p>
              <p className="text-[10px] font-medium text-muted-foreground truncate mt-0.5">Resolved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Alert List Container */}
      <Card className="border-border">
        <CardContent className="p-3">
          {loading && alerts.length === 0 ? (
            <div className="flex h-24 items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              <span>Fetching alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-4 text-center border border-dashed rounded-md text-muted-foreground text-xs">
              No active alerts.
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-2.5 h-8 bg-muted/60 p-0.5">
                <TabsTrigger value="all" className="h-7 text-xs px-2.5">All ({alerts.length})</TabsTrigger>
                <TabsTrigger value="unread" className="h-7 text-xs px-2.5">Pending ({unacknowledged.length})</TabsTrigger>
                <TabsTrigger value="critical" className="h-7 text-xs px-2.5">Critical ({critical.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-1.5 mt-0">
                {alerts.map((a) => (
                  <CompactAlertCard key={a.id} alert={a} onAck={handleAcknowledge} onDismiss={handleDismiss} />
                ))}
              </TabsContent>

              <TabsContent value="unread" className="space-y-1.5 mt-0">
                {unacknowledged.map((a) => (
                  <CompactAlertCard key={a.id} alert={a} onAck={handleAcknowledge} onDismiss={handleDismiss} />
                ))}
              </TabsContent>

              <TabsContent value="critical" className="space-y-1.5 mt-0">
                {alerts.filter((a) => a.type === "critical").map((a) => (
                  <CompactAlertCard key={a.id} alert={a} onAck={handleAcknowledge} onDismiss={handleDismiss} />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CompactAlertCard({ alert, onAck, onDismiss }: { alert: AlertRecord; onAck: (id: number | string) => void; onDismiss: (id: number | string) => void }) {
  const cfg = alertConfig[alert.type] || alertConfig.info
  const Icon = cfg.icon

  return (
    <div className={cn("rounded-md border px-2.5 py-2 transition-all", cfg.bgColor, cfg.borderColor, alert.acknowledged && "opacity-50 grayscale-[20%]")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-semibold text-foreground truncate">{alert.title}</h4>
              <Badge className={cn("text-[9px] px-1 py-0 h-4 font-medium uppercase shrink-0", cfg.badgeColor)}>{alert.type}</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">{alert.message}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{alert.station}</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatTimeAgo(alert.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            {!alert.acknowledged && (
              <Button variant="outline" size="sm" onClick={() => onAck(alert.id)} className="h-6 px-2 text-[10px] bg-background">
                Ack
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onDismiss(alert.id)} className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}