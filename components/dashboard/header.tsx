"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  Search,
  User,
  Menu,
  Activity,
  Sun,
  Moon,
  Laptop,
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"

export interface NotificationItem {
  id: string | number
  title: string
  description?: string
  time?: string
  severity?: "critical" | "warning" | "info"
  isRead: boolean
}

export interface HeaderProps {
  title?: string
  description?: string
  notificationCount?: number
  onMenuToggle?: () => void
  onSearch?: (query: string) => void
  onLogout?: () => void
  children?: React.ReactNode
}

const parseDateSafely = (rawDate: any): Date | null => {
  if (!rawDate) return null
  const formattedString = String(rawDate).trim().replace(" ", "T")
  const date = new Date(formattedString)
  return isNaN(date.getTime()) ? null : date
}

const getAlertIcon = (severity?: string) => {
  switch (severity?.toLowerCase()) {
    case "critical":
    case "high":
      return <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
    case "warning":
    case "moderate":
      return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
    default:
      return <Info className="h-4 w-4 shrink-0 text-emerald-500" />
  }
}

export function Header({
  title,
  description,
  notificationCount,
  onMenuToggle,
  onSearch,
  onLogout,
  children,
}: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/dashboard/overview")
        const result = await response.json()

        if (response.ok && result?.data?.recentAlerts) {
          const formattedAlerts: NotificationItem[] = result.data.recentAlerts.map(
            (alert: any, idx: number) => {
              const parsedDate = parseDateSafely(alert.created_at || alert.recorded_at)
              return {
                id: alert.id || `temp-${idx}-${Date.now()}`,
                title: alert.message || alert.description || "Air Quality Threshold Triggered",
                description: alert.district ? `Location: ${alert.district}` : undefined,
                severity: alert.severity || alert.alert_type || "info",
                time: parsedDate
                  ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "Recently",
                isRead: alert.is_read ?? alert.acknowledged ?? false,
              }
            }
          )
          setNotifications(formattedAlerts)
        }
      } catch (err) {
        console.error("Failed to fetch notifications in Header:", err)
      } finally {
        setLoadingAlerts(false)
      }
    }

    fetchAlerts()

    const channel = supabase
      .channel("header_alerts_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new
          const parsedDate = parseDateSafely(newAlert.created_at || newAlert.recorded_at)

          const newItem: NotificationItem = {
            id: newAlert.id || `temp-${Date.now()}`,
            title: newAlert.message || newAlert.description || "Air Quality Threshold Triggered",
            description: newAlert.district ? `Location: ${newAlert.district}` : undefined,
            severity: newAlert.severity || newAlert.alert_type || "info",
            time: parsedDate
              ? parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Just now",
            isRead: newAlert.is_read ?? newAlert.acknowledged ?? false,
          }

          setNotifications((prev) => [newItem, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const unreadCount = notificationCount ?? notifications.filter((n) => !n.isRead).length

  // Mark all notifications as read via /api/alerts
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id)
    if (unreadIds.length === 0) return

    // 1. Optimistic UI Update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))

    // 2. Persist to DB via API Route
    try {
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: unreadIds,
          acknowledged: true,
          is_read: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to mark all notifications as read:", response.status, errorData)
      }
    } catch (err) {
      console.error("Failed to sync mark all read status:", err)
    }
  }

  // Mark single notification as read via /api/alerts
  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.isRead) return

    // 1. Optimistic UI Update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    )

    // 2. Persist to DB via API Route
    try {
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          acknowledged: true,
          is_read: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to update notification read status:", response.status, errorData)
      }
    } catch (err) {
      console.error("Failed to sync alert read status:", err)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (onSearch) onSearch(val)
  }

  return (
    <header className="sticky top-0 z-30 flex w-full flex-col border-b border-border bg-card px-4 py-3 shadow-xs">
      <div className="flex w-full items-center justify-between gap-2">
        {/* Left Side: Mobile Menu Button, Logo, and Title */}
        <div className="flex items-center gap-2">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="shrink-0 md:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
          )}

          <Link href="/dashboard" className="flex items-center gap-2 shrink-0 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>

          {title && (
            <div className="hidden min-w-0 md:block">
              <h1 className="truncate text-lg font-semibold text-foreground">{title}</h1>
              {description && (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {children && <div className="flex items-center gap-2 mr-1">{children}</div>}

          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-48 bg-secondary pl-9 text-foreground placeholder:text-muted-foreground lg:w-64"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setShowMobileSearch((prev) => !prev)}
            aria-label="Toggle Search"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Theme Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
          </Button>

          {/* Notification Bell Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative shrink-0 cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-in zoom-in-50">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 sm:w-[420px] p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                {loadingAlerts ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Loading alerts...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No notifications available
                  </div>
                ) : (
                  notifications.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors ${
                        !item.isRead
                          ? "bg-emerald-500/10 border-l-4 border-l-emerald-500 hover:bg-emerald-500/15"
                          : "bg-transparent opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="mt-0.5">{getAlertIcon(item.severity)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs whitespace-normal leading-snug ${
                              !item.isRead
                                ? "font-bold text-foreground"
                                : "font-normal text-muted-foreground"
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.time && (
                            <span className="text-[10px] text-muted-foreground shrink-0 pt-0.5">
                              {item.time}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-muted-foreground whitespace-normal mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Account Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full cursor-pointer">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="w-full cursor-pointer">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="w-full cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Theme Mode</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showMobileSearch && (
        <div className="mt-2 block md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="w-full bg-secondary pl-9 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}