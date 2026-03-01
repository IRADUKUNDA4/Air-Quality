"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BarChart3,
  MapPin,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Stations", href: "/dashboard/stations", icon: MapPin },
  { title: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  mobileOpen?: boolean
  setMobileOpen?: (open: boolean) => void
}

export function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const handleCloseMobile = () => {
    if (setMobileOpen) setMobileOpen(false)
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={handleCloseMobile}
        />
      )}

      <aside
        className={cn(
          "sticky top-0 h-screen z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out shrink-0",
          mobileOpen ? "fixed inset-y-0 left-0 w-64 translate-x-0" : "max-md:-translate-x-full max-md:fixed max-md:inset-y-0 max-md:left-0",
          collapsed ? "md:w-16" : "md:w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" onClick={handleCloseMobile} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-lg font-semibold text-sidebar-foreground truncate">
                AirQuality
              </span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseMobile}
            className="md:hidden text-sidebar-foreground"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleCloseMobile}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.title}</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="hidden border-t border-border p-2 md:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}