'use client'

import { useAgent } from '@/contexts/agent-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const { selectedAgent, selectedAgentId } = useAgent();

  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Please select an agent to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-500 mt-1">
          For agent: {selectedAgent?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Performance Analytics
          </CardTitle>
          <CardDescription>
            Track metrics and insights for your AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Conversation metrics and trends</li>
            <li>• Lead conversion funnel analysis</li>
            <li>• Response time and quality metrics</li>
            <li>• Peak activity time analysis</li>
            <li>• Custom reports and exports</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
