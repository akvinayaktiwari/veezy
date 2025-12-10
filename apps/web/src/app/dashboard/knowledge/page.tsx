'use client'

import { useAgent } from '@/contexts/agent-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpenIcon } from '@heroicons/react/24/outline';

export default function KnowledgePage() {
  const { selectedAgent, selectedAgentId } = useAgent();

  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Please select an agent to manage knowledge base</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <p className="text-gray-500 mt-1">
          For agent: {selectedAgent?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5" />
            Training Materials
          </CardTitle>
          <CardDescription>
            Manage training data and context for your AI agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Upload PDFs, docs, and text files</li>
            <li>• Create FAQ databases</li>
            <li>• Product/service information</li>
            <li>• Company policies and procedures</li>
            <li>• Automatic embedding and indexing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
