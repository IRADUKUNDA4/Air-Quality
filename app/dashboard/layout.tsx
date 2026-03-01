"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />
      
      <div className="flex flex-1 flex-col min-w-0">
        <Header
          notificationCount={3}
          onMenuToggle={() => setIsMobileOpen((prev) => !prev)}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}