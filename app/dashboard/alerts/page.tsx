"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ChevronRight,
} from "lucide-react"

const alerts = [
  {
    id: 1,
    type: "critical",
    title: "PM2.5 Exceeds Safety Threshold",
    message: "PM2.5 levels at Nyabugogo Bus Terminal have exceeded the safe limit of 35 µg/m³, currently at 48 µg/m³.",
    station: "Nyabugogo Bus Terminal",
    timestamp: "10 minutes ago",
    acknowledged: false,
  },
  {
    id: 2,
    type: "warning",
    title: "AQI Approaching Unhealthy Level",
    message: "Air Quality Index at Kicukiro Industrial Zone is approaching unhealthy levels. Current AQI: 95.",
    station: "Kicukiro Industrial Zone",
    timestamp: "25 minutes ago",
    acknowledged: false,
  },
  {
    id: 3,
    type: "info",
    title: "New Monitoring Station Online",
    message: "Kibagabaga Hospital monitoring station is now online and transmitting data.",
    station: "Kibagabaga Hospital",
    timestamp: "1 hour ago",
    acknowledged: true,
  },
  {
    id: 4,
    type: "warning",
    title: "Ozone Levels Rising",
    message: "Ground-level ozone concentrations are increasing in Gasabo District due to high temperatures.",
    station: "Kimironko Market",
    timestamp: "2 hours ago",
    acknowledged: true,
  },
  {
    id: 5,
    type: "success",
    title: "Air Quality Improved",
    message: "Air quality in Nyamirambo has improved to 'Good' status following overnight rain.",
    station: "Nyamirambo",
    timestamp: "3 hours ago",
    acknowledged: true,
  },
  {
    id: 6,
    type: "critical",
    title: "Station Offline",
    message: "Remera Residential monitoring station has gone offline. Battery level critically low at 12%.",
    station: "Remera Residential",
    timestamp: "4 hours ago",
    acknowledged: false,
  },
  {
    id: 7,
    type: "info",
    title: "Weekly Report Available",
    message: "Your weekly air quality summary report is now available for download.",
    station: "System",
    timestamp: "5 hours ago",
    acknowledged: true,
  },
  {
    id: 8,
    type: "warning",
    title: "High Traffic Hours Alert",
    message: "Elevated pollution levels expected during evening rush hour (5-7 PM) in central Kigali.",
    station: "Kigali City Center",
    timestamp: "6 hours ago",
    acknowledged: true,
  },
]

const alertConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-aqi-unhealthy",
    bgColor: "bg-aqi-unhealthy/10",
    borderColor: "border-aqi-unhealthy/30",
    badgeColor: "bg-aqi-unhealthy text-background",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-aqi-moderate",
    bgColor: "bg-aqi-moderate/10",
    borderColor: "border-aqi-moderate/30",
    badgeColor: "bg-aqi-moderate text-background",
  },
  info: {
    icon: Info,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    borderColor: "border-chart-2/30",
    badgeColor: "bg-chart-2 text-background",
  },
  success: {
    icon: CheckCircle,
    color: "text-aqi-good",
    bgColor: "bg-aqi-good/10",
    borderColor: "border-aqi-good/30",
    badgeColor: "bg-aqi-good text-background",
  },
}

export default function AlertsPage() {
  const [alertsList, setAlertsList] = useState(alerts)

  const unacknowledgedCount = alertsList.filter(a => !a.acknowledged).length
  const criticalCount = alertsList.filter(a => a.type === "critical" && !a.acknowledged).length

  const acknowledgeAlert = (id: number) => {
    setAlertsList(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  const dismissAlert = (id: number) => {
    setAlertsList(prev => prev.filter(alert => alert.id !== id))
  }

  return (
    <>
      <Header
        title="Alerts"
        description="Monitor and manage air quality alerts"
      />
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-aqi-unhealthy/20">
                  <AlertTriangle className="h-6 w-6 text-aqi-unhealthy" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                  <p className="text-sm text-muted-foreground">Critical Alerts</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{unacknowledgedCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-aqi-good/20">
                  <CheckCircle className="h-6 w-6 text-aqi-good" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{alertsList.filter(a => a.acknowledged).length}</p>
                  <p className="text-sm text-muted-foreground">Acknowledged</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4 bg-secondary">
                  <TabsTrigger value="all">All ({alertsList.length})</TabsTrigger>
                  <TabsTrigger value="unread">Unread ({unacknowledgedCount})</TabsTrigger>
                  <TabsTrigger value="critical">Critical ({alertsList.filter(a => a.type === "critical").length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-3">
                  {alertsList.map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledgeAlert}
                      onDismiss={dismissAlert}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="unread" className="space-y-3">
                  {alertsList.filter(a => !a.acknowledged).map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledgeAlert}
                      onDismiss={dismissAlert}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="critical" className="space-y-3">
                  {alertsList.filter(a => a.type === "critical").map((alert) => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={acknowledgeAlert}
                      onDismiss={dismissAlert}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Alert Settings Quick Access */}
          <Card className="bg-card border-border">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Alert Preferences</p>
                  <p className="text-sm text-muted-foreground">Configure notification thresholds and channels</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                Configure
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

interface AlertItemProps {
  alert: typeof alerts[0]
  onAcknowledge: (id: number) => void
  onDismiss: (id: number) => void
}

function AlertItem({ alert, onAcknowledge, onDismiss }: AlertItemProps) {
  const config = alertConfig[alert.type as keyof typeof alertConfig]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        config.bgColor,
        config.borderColor,
        alert.acknowledged && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("mt-0.5 rounded-full p-2", config.bgColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{alert.title}</h4>
                <Badge className={cn("text-xs", config.badgeColor)}>
                  {alert.type}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {alert.station}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alert.timestamp}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!alert.acknowledged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcknowledge(alert.id)}
                  className="text-xs"
                >
                  Acknowledge
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDismiss(alert.id)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
