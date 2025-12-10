'use client'

import { useAgent } from '@/contexts/agent-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function ImportPage() {
  const { selectedAgent, selectedAgentId } = useAgent();

  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Please select an agent to import leads</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Import Leads</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-500 mt-1">
          For agent: {selectedAgent?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Bulk Import
          </CardTitle>
          <CardDescription>
            Upload and import leads from various sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• CSV and Excel file uploads</li>
            <li>• CRM integrations (Salesforce, HubSpot)</li>
            <li>• Field mapping and validation</li>
            <li>• Duplicate detection</li>
            <li>• Bulk import history and rollback</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
