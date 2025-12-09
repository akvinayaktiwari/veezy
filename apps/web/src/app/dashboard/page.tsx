import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Veezy Dashboard</h1>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {tenant?.name || userName}!
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
            {tenant && (
              <p className="text-gray-600">
                <span className="font-medium">Tenant ID:</span> {tenant.id}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Agents</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Active AI agents</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Leads</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Total leads captured</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bookings</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Scheduled meetings</p>
          </div>
        </div>
      </main>
    </div>
  );
}
