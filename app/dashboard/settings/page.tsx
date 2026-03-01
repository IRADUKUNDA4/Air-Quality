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
import { Separator } from "@/components/ui/separator"
import { Bell, Shield, Database, Palette, User, Globe, Loader2, CheckCircle2 } from "lucide-react"

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
  nh3_threshold: number
  no2_threshold: number
  so2_threshold: number
  co2_threshold: number
  pm10_threshold: number
  pm25_threshold: number
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
  co_threshold: 9,
  nh3_threshold: 200,
  no2_threshold: 100,
  so2_threshold: 75,
  co2_threshold: 1000,
  pm10_threshold: 150,
  pm25_threshold: 35,
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

  // Load initial active theme into settings state
  useEffect(() => {
    if (theme) {
      setSettings((prev) => ({ ...prev, theme }))
    }
  }, [theme])

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Handle theme dropdown changes immediately
  const handleThemeChange = (newTheme: string) => {
    updateSetting("theme", newTheme)
    setTheme(newTheme) // Activates dark/light mode instantaneously
  }

  const handleSave = async () => {
    setSaving(true)
    setStatusMessage(null)

    try {
      localStorage.setItem("user_settings", JSON.stringify(settings))

      // Optional backend sync
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

        <Tabs defaultValue="appearance" className="space-y-6">
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
              value="data"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Database className="mr-2 h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Appearance</CardTitle>
                <CardDescription>Customize the interface mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground">Select system theme</p>
                  </div>
                  <Select
                    value={settings.theme}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger className="w-[180px] bg-secondary">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Thresholds Settings */}
          <TabsContent value="thresholds" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Alert Thresholds</CardTitle>
                <CardDescription>
                  Configure environmental limits for all 9 active sensor metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
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
                    <Label htmlFor="co-threshold">CO Warning (ppm)</Label>
                    <Input
                      id="co-threshold"
                      type="number"
                      value={settings.co_threshold}
                      onChange={(e) => updateSetting("co_threshold", Number(e.target.value))}
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
                    <Label htmlFor="nh3-threshold">NH3 Warning (µg/m³)</Label>
                    <Input
                      id="nh3-threshold"
                      type="number"
                      value={settings.nh3_threshold}
                      onChange={(e) => updateSetting("nh3_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no2-threshold">NO2 Warning (ppb)</Label>
                    <Input
                      id="no2-threshold"
                      type="number"
                      value={settings.no2_threshold}
                      onChange={(e) => updateSetting("no2_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="so2-threshold">SO2 Warning (ppb)</Label>
                    <Input
                      id="so2-threshold"
                      type="number"
                      value={settings.so2_threshold}
                      onChange={(e) => updateSetting("so2_threshold", Number(e.target.value))}
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
                    <Label htmlFor="pm25-threshold">PM2.5 Warning (µg/m³)</Label>
                    <Input
                      id="pm25-threshold"
                      type="number"
                      value={settings.pm25_threshold}
                      onChange={(e) => updateSetting("pm25_threshold", Number(e.target.value))}
                      className="bg-secondary"
                    />
                  </div>
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