'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bars3Icon, PlusIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { AgentSelector } from './agent-selector';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  userEmail?: string;
}

export function DashboardHeader({ onMenuClick, userEmail }: DashboardHeaderProps) {
  const userInitials = userEmail?.charAt(0).toUpperCase() || 'U';

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
          <Button variant="outline" size="sm" className="gap-1.5">
            <PlusIcon className="h-4 w-4" />
            <span className="hidden md:inline">Create Agent</span>
            <span className="hidden sm:inline md:hidden">Create</span>
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-blue-600 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircleIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Cog6ToothIcon className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/auth/signout" method="post" className="w-full">
                  <button type="submit" className="flex w-full items-center text-red-600">
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
