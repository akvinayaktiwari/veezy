'use client';

import { useState } from 'react';
import { DashboardHeader } from './dashboard-header';
import { DashboardSidebar } from './dashboard-sidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function DashboardLayoutClient({ children, userEmail }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      {/* Header */}
      <DashboardHeader
        onMenuClick={() => setIsMobileMenuOpen(true)}
        userEmail={userEmail}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64" suppressHydrationWarning>
          <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
          <div className="pt-4">
            <DashboardSidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
