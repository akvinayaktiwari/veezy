'use client'

import { useState } from 'react'
import { DashboardHeader } from './dashboard-header'
import { DashboardSidebar } from './dashboard-sidebar'
import { MobileNav } from './mobile-nav'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  userEmail?: string
}

export function DashboardLayoutClient({
  children,
  userEmail,
}: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        onMenuClick={() => setIsMobileMenuOpen(true)}
        userEmail={userEmail}
      />

      {/* Tablet Sidebar - Collapsed (768px - 1023px) */}
      <aside className="hidden md:block lg:hidden fixed left-0 top-16 bottom-0 w-20 bg-white border-r overflow-y-auto">
        <DashboardSidebar isCollapsed={true} />
      </aside>

      {/* Desktop Sidebar - Full (≥1024px) */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r overflow-y-auto">
        <DashboardSidebar isCollapsed={false} />
      </aside>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="pt-16 md:pl-20 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
