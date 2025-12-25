import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardLayoutClient } from '../../components/dashboard/dashboard-layout-client';
import { AgentProvider } from '@/contexts/agent-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AgentProvider>
      <DashboardLayoutClient userEmail={session.user.email}>
        {children}
      </DashboardLayoutClient>
    </AgentProvider>
  );
}
