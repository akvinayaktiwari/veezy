import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/stat-card';
import { EmptyState } from '@/components/dashboard/empty-state';
import {
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

interface Tenant {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

async function getOrCreateTenant(userId: string, userName: string): Promise<Tenant | null> {
  try {
    // Try to get existing tenant
    const response = await fetch(`${API_URL}/tenants/by-user/${userId}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      return await response.json();
    }

    // If tenant doesn't exist, create one
    if (response.status === 404) {
      const createResponse = await fetch(`${API_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: userName,
        }),
      });

      if (createResponse.ok) {
        return await createResponse.json();
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting/creating tenant:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  const user = session.user;
  const userName = user.email?.split('@')[0] || 'User';

  // Get or create tenant for this user
  const tenant = await getOrCreateTenant(user.id, userName);

  // Mock data - replace with actual API calls later
  const hasAgents = false;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {tenant?.name || userName}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your AI sales agents
        </p>
      </div>

      {/* Stats Grid */}
      {hasAgents ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Active Agents"
            value={3}
            icon={<UserGroupIcon className="h-6 w-6" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Total Leads"
            value={247}
            icon={<ChartBarIcon className="h-6 w-6" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Bookings"
            value={18}
            icon={<CalendarIcon className="h-6 w-6" />}
            trend={{ value: 3, isPositive: false }}
          />
        </div>
      ) : (
        <EmptyState
          icon={<UserGroupIcon className="h-16 w-16" />}
          title="No agents yet"
          description="Create your first AI sales agent to start capturing leads and booking meetings automatically."
          action={{
            label: 'Create Your First Agent',
            href: '/dashboard/agents/create',
          }}
        />
      )}
    </div>
  );
}
