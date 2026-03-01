"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Bell, Search, User, Menu, Activity, Sun, Moon, Laptop } from "lucide-react"
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

export interface HeaderProps {
  /** Optional title to display on tablet/desktop viewports */
  title?: string
  /** Optional subtitle or description text */
  description?: string
  /** Notification badge count (pass 0 or undefined to hide badge) */
  notificationCount?: number
  /** Callback fired when clicking the mobile hamburger button */
  onMenuToggle?: () => void
  /** Callback fired when user types in the search bar */
  onSearch?: (query: string) => void
  /** Callback fired when user clicks 'Log out' */
  onLogout?: () => void
  /** React nodes for custom page-specific action buttons inserted into the right side bar */
  children?: React.ReactNode
}

export function Header({
  title,
  description,
  notificationCount = 0,
  onMenuToggle,
  onSearch,
  onLogout,
  children,
}: HeaderProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { setTheme, theme } = useTheme()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (onSearch) onSearch(val)
  }

  return (
    <header className="sticky top-0 z-30 flex w-full flex-col border-b border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex w-full items-center justify-between gap-2">
        
        {/* Left Side: Mobile Menu Button, Mobile Logo, & Title */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="shrink-0 md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </Button>

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

        {/* Right Side: Page Actions, Search, Theme Toggle, Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-3">
          {children && <div className="flex items-center gap-2 mr-1">{children}</div>}

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

          {/* Theme Mode Toggle Button */}
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

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="View notifications">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Button>

          {/* Profile Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
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

              {/* Theme Selector Submenu */}
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