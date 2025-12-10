'use client'

import { useAgent } from '@/contexts/agent-context'
import { Badge } from '@/components/ui/badge'
import { FeaturePlaceholder } from '@/components/dashboard/feature-placeholder'
import { ChartBarIcon } from '@heroicons/react/24/outline'

export default function AnalyticsPage() {
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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            For agent: {selectedAgent?.name}
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <FeaturePlaceholder
        icon={<ChartBarIcon className="h-16 w-16" />}
        title="Lead Analytics"
        description={`Track performance metrics and insights for ${selectedAgent?.name}`}
        features={[
          'Conversion funnel analysis',
          'Meeting attendance rates',
          'Lead engagement metrics',
          'Response time tracking',
          'Revenue attribution',
          'Custom date range filters',
        ]}
      />
    </div>
  )
}
