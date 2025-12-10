'use client'

import { usePathname } from 'next/navigation'
import { NavItem } from './nav-item'
import {
  HomeIcon,
  ChartBarIcon,
  BookOpenIcon,
  LinkIcon,
  ArrowUpTrayIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/dashboard/analytics', label: 'Analytics', icon: ChartBarIcon },
  { href: '/dashboard/knowledge', label: 'Knowledge', icon: BookOpenIcon },
  { href: '/dashboard/links', label: 'Links', icon: LinkIcon },
  { href: '/dashboard/import', label: 'Import', icon: ArrowUpTrayIcon },
  { href: '/dashboard/email', label: 'Email', icon: EnvelopeIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: Cog6ToothIcon },
]

interface DashboardSidebarProps {
  isCollapsed?: boolean
  isMobile?: boolean
  onNavigate?: () => void
}

export function DashboardSidebar({
  isCollapsed = false,
  isMobile = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-2 py-4 px-3">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={<item.icon />}
            label={item.label}
            isActive={pathname === item.href}
            isCollapsed={isCollapsed && !isMobile}
            onClick={onNavigate}
          />
        ))}
      </nav>
    </div>
  )
}
