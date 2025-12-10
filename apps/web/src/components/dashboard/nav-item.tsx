'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  isCollapsed?: boolean
  onClick?: () => void
}

export function NavItem({
  href,
  icon,
  label,
  isActive,
  isCollapsed = false,
  onClick,
}: NavItemProps) {
  const content = (
    <Button
      asChild
      variant={isActive ? 'secondary' : 'ghost'}
      className={`w-full justify-start ${isCollapsed ? 'justify-center px-2' : ''} ${
        isActive ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : ''
      }`}
      size={isCollapsed ? 'icon' : 'default'}
      onClick={onClick}
    >
      <Link href={href}>
        <span className="h-5 w-5">{icon}</span>
        {!isCollapsed && <span className="ml-3">{label}</span>}
      </Link>
    </Button>
  )

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}
