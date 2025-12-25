'use client'

import { useAgent } from '@/contexts/agent-context'
import { Badge } from '@/components/ui/badge'
import { FeaturePlaceholder } from '@/components/dashboard/feature-placeholder'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function ImportPage() {
  const { selectedAgent, selectedAgentId } = useAgent()

  if (!selectedAgentId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please select an agent</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Import</h1>
          <p className="text-muted-foreground mt-1">
            For agent: {selectedAgent?.name}
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <FeaturePlaceholder
        icon={<ArrowUpTrayIcon className="h-16 w-16" />}
        title="Bulk Lead Import"
        description={`Import leads from CSV and send booking invitations automatically for ${selectedAgent?.name}`}
        features={[
          'CSV file upload with validation',
          'Field mapping interface',
          'Bulk email invitations',
          'Import history and logs',
          'Duplicate detection',
          'Schedule import campaigns',
        ]}
      />
    </div>
  )
}
