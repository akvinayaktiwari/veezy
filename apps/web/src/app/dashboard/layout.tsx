'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
}

export default function DashboardLayout({ children, userEmail }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
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
        <SheetContent side="left" className="p-0 w-64">
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
