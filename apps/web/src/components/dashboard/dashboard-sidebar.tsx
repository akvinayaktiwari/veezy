'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  HomeIcon,
  ChartBarIcon,
  BookOpenIcon,
  LinkIcon,
  ArrowUpTrayIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Lead Analytics',
    href: '/dashboard/analytics',
    icon: ChartBarIcon,
  },
  {
    name: 'Knowledge Base',
    href: '/dashboard/knowledge',
    icon: BookOpenIcon,
  },
  {
    name: 'Booking Links',
    href: '/dashboard/links',
    icon: LinkIcon,
  },
];

const secondaryNavigation = [
  {
    name: 'Lead Import',
    href: '/dashboard/import',
    icon: ArrowUpTrayIcon,
  },
  {
    name: 'Email Campaigns',
    href: '/dashboard/email',
    icon: EnvelopeIcon,
  },
];

const settingsNavigation = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Cog6ToothIcon,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r overflow-y-auto">
      <nav className="p-4 space-y-6">
        {/* Primary Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* Settings Navigation */}
        <div className="space-y-1">
          {settingsNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
