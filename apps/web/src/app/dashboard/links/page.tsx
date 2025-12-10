'use client'

import { useAgent } from '@/contexts/agent-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon } from '@heroicons/react/24/outline';

export default function LinksPage() {
  const { selectedAgent, selectedAgentId } = useAgent();

  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Please select an agent to manage booking links</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Booking Links</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-500 mt-1">
          For agent: {selectedAgent?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Create shareable booking links for your calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Generate custom booking URLs</li>
            <li>• Calendar sync (Google, Outlook, CalDAV)</li>
            <li>• Availability management</li>
            <li>• Automated confirmation emails</li>
            <li>• Booking page customization</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
