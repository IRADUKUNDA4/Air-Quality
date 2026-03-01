"use client"

import { Header } from "@/components/dashboard/header"
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
import { Bell, Shield, Database, Palette, User, Globe } from "lucide-react"

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Settings"
        description="Manage your dashboard preferences"
      />
      <div className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-4xl">
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

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">General Settings</CardTitle>
                  <CardDescription>Configure basic dashboard settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="cat">
                        <SelectTrigger id="timezone" className="bg-secondary">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cat">Central Africa Time (CAT)</SelectItem>
                          <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
                          <SelectItem value="utc">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select defaultValue="en">
                        <SelectTrigger id="language" className="bg-secondary">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="rw">Kinyarwanda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="units">Measurement Units</Label>
                      <Select defaultValue="metric">
                        <SelectTrigger id="units" className="bg-secondary">
                          <SelectValue placeholder="Select units" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metric">Metric (µg/m³, °C)</SelectItem>
                          <SelectItem value="imperial">Imperial (oz/ft³, °F)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refresh">Auto-refresh Interval</Label>
                      <Select defaultValue="5">
                        <SelectTrigger id="refresh" className="bg-secondary">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Every 1 minute</SelectItem>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="realtime">Real-time Updates</Label>
                      <p className="text-sm text-muted-foreground">Enable live data streaming</p>
                    </div>
                    <Switch id="realtime" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Notification Preferences</CardTitle>
                  <CardDescription>Configure how you receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">Critical alerts via SMS</p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">Daily summary email at 8 AM</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Report</Label>
                      <p className="text-sm text-muted-foreground">Weekly analytics report</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Thresholds Settings */}
            <TabsContent value="thresholds" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Alert Thresholds</CardTitle>
                  <CardDescription>Set custom alert trigger levels for pollutants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pm25-threshold">PM2.5 Warning (µg/m³)</Label>
                      <Input id="pm25-threshold" type="number" defaultValue="35" className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pm10-threshold">PM10 Warning (µg/m³)</Label>
                      <Input id="pm10-threshold" type="number" defaultValue="150" className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="o3-threshold">O3 Warning (ppb)</Label>
                      <Input id="o3-threshold" type="number" defaultValue="100" className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="no2-threshold">NO2 Warning (ppb)</Label>
                      <Input id="no2-threshold" type="number" defaultValue="100" className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="so2-threshold">SO2 Warning (ppb)</Label>
                      <Input id="so2-threshold" type="number" defaultValue="75" className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co-threshold">CO Warning (ppm)</Label>
                      <Input id="co-threshold" type="number" defaultValue="9" className="bg-secondary" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="aqi-critical">Critical AQI Level</Label>
                    <Input id="aqi-critical" type="number" defaultValue="150" className="bg-secondary max-w-[200px]" />
                    <p className="text-sm text-muted-foreground">Trigger critical alert when AQI exceeds this value</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Settings */}
            <TabsContent value="data" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Data Management</CardTitle>
                  <CardDescription>Configure data storage and export options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Data Retention Period</Label>
                      <p className="text-sm text-muted-foreground">How long to keep historical data</p>
                    </div>
                    <Select defaultValue="365">
                      <SelectTrigger className="w-[180px] bg-secondary">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Export Data</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline">Export CSV</Button>
                      <Button variant="outline">Export JSON</Button>
                      <Button variant="outline">Generate Report</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>API Access</Label>
                      <p className="text-sm text-muted-foreground">Enable external API access</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Appearance</CardTitle>
                  <CardDescription>Customize the look and feel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Select defaultValue="dark">
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

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable chart animations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Account Settings</CardTitle>
                  <CardDescription>Manage your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" defaultValue="John Doe" className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="john@example.com" className="bg-secondary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" defaultValue="Rwanda Environment Authority" className="bg-secondary" />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Security</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline">Change Password</Button>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-3">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
