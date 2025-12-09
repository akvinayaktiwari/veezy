import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import DashboardLayout from '../layout';
import { LinkIcon } from '@heroicons/react/24/outline';

export default async function LinksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <DashboardLayout userEmail={session.user.email}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Links</h1>
          <p className="text-gray-500 mt-1">
            Create and manage shareable booking links for your calendar
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <LinkIcon className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Booking Links Coming Soon
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            Generate custom booking links and integrate with your calendar system.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
