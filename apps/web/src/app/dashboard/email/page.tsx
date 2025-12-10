'use client'

import { useAgent } from '@/contexts/agent-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function EmailPage() {
  const { selectedAgent, selectedAgentId } = useAgent();

  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Please select an agent to manage email campaigns</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-500 mt-1">
          For agent: {selectedAgent?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnvelopeIcon className="h-5 w-5" />
            Automated Sequences
          </CardTitle>
          <CardDescription>
            Create and manage automated email sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Drag-and-drop email builder</li>
            <li>• Multi-step nurture sequences</li>
            <li>• A/B testing and optimization</li>
            <li>• Engagement tracking and analytics</li>
            <li>• Template library</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
