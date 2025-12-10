'use client'

import { useAgent } from '@/contexts/agent-context';
import { StatCard } from '@/components/dashboard/stat-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { agents, selectedAgent, selectedAgentId, isLoading } = useAgent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={<UserGroupIcon className="h-16 w-16" />}
        title="No agents yet"
        description="Create your first AI sales agent to start capturing leads and booking meetings automatically."
        action={{
          label: 'Create Your First Agent',
          href: '/dashboard/agents/create',
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview for {selectedAgent?.name || 'your agent'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={247}
          icon={<UserGroupIcon className="h-6 w-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Conversations"
          value={156}
          icon={<ChartBarIcon className="h-6 w-6" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Bookings"
          value={18}
          icon={<CalendarIcon className="h-6 w-6" />}
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Conversion Rate"
          value="7.3%"
          icon={<ChartBarIcon className="h-6 w-6" />}
          trend={{ value: 2, isPositive: true }}
        />
      </div>
    </div>
  );
}
