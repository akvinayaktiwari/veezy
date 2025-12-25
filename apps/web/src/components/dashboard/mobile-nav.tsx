'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DashboardSidebar } from './dashboard-sidebar'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold">
              V
            </div>
            <span className="text-lg font-bold">Veezy</span>
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          <DashboardSidebar isMobile onNavigate={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
