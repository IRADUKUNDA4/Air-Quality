"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Shield, Palette, User, Globe, Loader2, CheckCircle2 } from "lucide-react"

export interface UserSettings {
  timezone: string
  language: string
  units: string
  refresh_interval: string
  realtime_updates: boolean
  email_notifications: boolean
  push_notifications: boolean
  sms_alerts: boolean
  daily_digest: boolean
  weekly_report: boolean
  humidity_threshold: number
  temp_threshold: number
  co_threshold: number
  no2_threshold: number
  so2_threshold: number
  co2_threshold: number
  pm10_threshold: number
  pm25_threshold: number
  aqi_threshold: number
  aqi_critical: number
  data_retention: string
  api_access: boolean
  theme: string
  compact_mode: boolean
  show_animations: boolean
  full_name: string
  email: string
  organization: string
}

const defaultSettings: UserSettings = {
  timezone: "cat",
  language: "en",
  units: "metric",
  refresh_interval: "5",
  realtime_updates: true,
  email_notifications: true,
  push_notifications: true,
  sms_alerts: false,
  daily_digest: true,
  weekly_report: true,
  humidity_threshold: 70,
  temp_threshold: 35,
  co_threshold: 9.4,
  no2_threshold: 0.1,
  so2_threshold: 0.075,
  co2_threshold: 1000,
  pm10_threshold: 150,
  pm25_threshold: 35.4,
  aqi_threshold: 100,
  aqi_critical: 150,
  data_retention: "365",
  api_access: false,
  theme: "dark",
  compact_mode: false,
  show_animations: true,
  full_name: "Laetitia Nikuzwe",
  email: "laetitia@example.com",
  organization: "Integrated Solutions for Engineering and Construction",
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    // Load persisted local settings if available
    const local = localStorage.getItem("user_settings")
    if (local) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(local) }))
      } catch (err) {
        console.error("Error reading saved settings", err)
      }
    }
  }, [])

  useEffect(() => {
    if (theme) {
      setSettings((prev) => ({ ...prev, theme }))
    }
  }, [theme])

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleThemeChange = (newTheme: string) => {
    updateSetting("theme", newTheme)
    setTheme(newTheme)
  }

  const handleSave = async () => {
    setSaving(true)
    setStatusMessage(null)

    try {
      localStorage.setItem("user_settings", JSON.stringify(settings))

      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }).catch(() => null)

      setStatusMessage("Settings saved successfully!")
    } catch (err) {
      console.error(err)
      setStatusMessage("Failed to save changes.")
    } finally {
      setSaving(false)
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {statusMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
            <TabsTrigger
              value="general"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="thresholds"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="mr-2 h-4 w-4" />
              Thresholds
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Profile & User Info</CardTitle>
                <CardDescription>
                  Manage your personal account information and organization details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={settings.full_name}
                      onChange={(e) => updateSetting("full_name", e.target.value)}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting("email", e.target.value)}
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={settings.organization}
                    onChange={(e) => updateSetting("organization", e.target.value)}
                    className="bg-secondary"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">System Preferences</CardTitle>
                <CardDescription>
                  Configure system localization, refresh intervals, and units
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={settings.timezone} onValueChange={(val) => updateSetting("timezone", val)}>
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cat">Central Africa Time (CAT) - UTC+2</SelectItem>
                        <SelectItem value="utc">Coordinated Universal Time (UTC)</SelectItem>
                        <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Measurement Units</Label>
                    <Select value={settings.units} onValueChange={(val) => updateSetting("units", val)}>
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select units" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (°C, µg/m³)</SelectItem>
                        <SelectItem value="imperial">Imperial (°F, ppm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Auto-Refresh Interval</Label>
                    <Select value={settings.refresh_interval} onValueChange={(val) => updateSetting("refresh_interval", val)}>
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Every 2 Minutes</SelectItem>
                        <SelectItem value="5">Every 5 Minutes</SelectItem>
                        <SelectItem value="10">Every 10 Minutes</SelectItem>
                        <SelectItem value="manual">Manual Refresh Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Retention</Label>
                    <Select value={settings.data_retention} onValueChange={(val) => updateSetting("data_retention", val)}>
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Select retention period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="90">90 Days</SelectItem>
                        <SelectItem value="180">180 Days</SelectItem>
                        <SelectItem value="365">1 Year</SelectItem>
                        <SelectItem value="forever">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label>Realtime Supabase Updates</Label>
                    <p className="text-xs text-muted-foreground">
                      Listen for instant PostgreSQL database changes over WebSockets
                    </p>
                  </div>
                  <Switch
                    checked={settings.realtime_updates}
                    onCheckedChange={(val) => updateSetting("realtime_updates", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Alert & Notification Delivery</CardTitle>
                <CardDescription>
                  Configure how and when you receive system alerts when thresholds are exceeded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive immediate emails when any pollutant crosses critical thresholds
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(val) => updateSetting("email_notifications", val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Send browser push alerts when air quality deteriorates
                    </p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(val) => updateSetting("push_notifications", val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Urgent Alerts</Label>
                    <p className="text-xs text-muted-foreground">
                      Deliver direct SMS text messages for emergency AQI levels
                    </p>
                  </div>
                  <Switch
                    checked={settings.sms_alerts}
                    onCheckedChange={(val) => updateSetting("sms_alerts", val)}
                  />
                </div>

                <hr className="border-border" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-xs text-muted-foreground">
                      Get a daily summary report of station readings at 08:00 AM
                    </p>
                  </div>
                  <Switch
                    checked={settings.daily_digest}
                    onCheckedChange={(val) => updateSetting("daily_digest", val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Analytics Email</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive comprehensive weekly trends and station statistics
                    </p>
                  </div>
                  <Switch
                    checked={settings.weekly_report}
                    onCheckedChange={(val) => updateSetting("weekly_report", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alert Thresholds Settings */}
          <TabsContent value="thresholds" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Alert Thresholds</CardTitle>
                <CardDescription>
                  Configure upper limits for AQI, Gas metrics (in ppm), and environmental parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="aqi-threshold">Average AQI Warning</Label>
                    <Input
                      id="aqi-threshold"
                      type="number"
                      value={settings.aqi_threshold}
                      onChange={(e) => updateSetting("aqi_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aqi-critical">AQI Critical Limit</Label>
                    <Input
                      id="aqi-critical"
                      type="number"
                      value={settings.aqi_critical}
                      onChange={(e) => updateSetting("aqi_critical", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm25-threshold">PM2.5 Warning (µg/m³)</Label>
                    <Input
                      id="pm25-threshold"
                      type="number"
                      step="0.1"
                      value={settings.pm25_threshold}
                      onChange={(e) => updateSetting("pm25_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm10-threshold">PM10 Warning (µg/m³)</Label>
                    <Input
                      id="pm10-threshold"
                      type="number"
                      value={settings.pm10_threshold}
                      onChange={(e) => updateSetting("pm10_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-threshold">CO Warning (ppm)</Label>
                    <Input
                      id="co-threshold"
                      type="number"
                      step="0.1"
                      value={settings.co_threshold}
                      onChange={(e) => updateSetting("co_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no2-threshold">NO2 Warning (ppm)</Label>
                    <Input
                      id="no2-threshold"
                      type="number"
                      step="0.001"
                      value={settings.no2_threshold}
                      onChange={(e) => updateSetting("no2_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="so2-threshold">SO2 Warning (ppm)</Label>
                    <Input
                      id="so2-threshold"
                      type="number"
                      step="0.001"
                      value={settings.so2_threshold}
                      onChange={(e) => updateSetting("so2_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co2-threshold">CO2 Warning (ppm)</Label>
                    <Input
                      id="co2-threshold"
                      type="number"
                      value={settings.co2_threshold}
                      onChange={(e) => updateSetting("co2_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temp-threshold">Temperature Threshold (°C)</Label>
                    <Input
                      id="temp-threshold"
                      type="number"
                      value={settings.temp_threshold}
                      onChange={(e) => updateSetting("temp_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="humidity-threshold">Humidity Threshold (%)</Label>
                    <Input
                      id="humidity-threshold"
                      type="number"
                      value={settings.humidity_threshold}
                      onChange={(e) => updateSetting("humidity_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">UI & Appearance</CardTitle>
                <CardDescription>
                  Customize dashboard color themes, layout density, and visual options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Interface Theme</Label>
                  <Select value={settings.theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark Theme</SelectItem>
                      <SelectItem value="light">Light Theme</SelectItem>
                      <SelectItem value="system">System Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Display Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Reduce padding and card heights across dashboard charts
                    </p>
                  </div>
                  <Switch
                    checked={settings.compact_mode}
                    onCheckedChange={(val) => updateSetting("compact_mode", val)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Interface Animations</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable smooth transition effects and chart rendering animations
                    </p>
                  </div>
                  <Switch
                    checked={settings.show_animations}
                    onCheckedChange={(val) => updateSetting("show_animations", val)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}