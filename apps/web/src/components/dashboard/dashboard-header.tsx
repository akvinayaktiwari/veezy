'use client';

import { Button } from '@/components/ui/button';
import { Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';
import { AgentSelector } from './agent-selector';
import { ProfileDropdown } from '@/components/profile-dropdown';
import Link from 'next/link';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  userEmail?: string;
}

export function DashboardHeader({ onMenuClick, userEmail }: DashboardHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
              V
            </div>
            <span className="text-xl font-bold text-gray-900">Veezy</span>
          </div>
        </div>

        {/* Center Section - Agent Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <AgentSelector />
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard/agents/create">
              <PlusIcon className="h-4 w-4" />
              <span className="hidden md:inline">Create Agent</span>
              <span className="hidden sm:inline md:hidden">Create</span>
            </Link>
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center ml-auto">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
