'use client'

import { useAgent } from '@/contexts/agent-context'
import { Badge } from '@/components/ui/badge'
import { FeaturePlaceholder } from '@/components/dashboard/feature-placeholder'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function EmailPage() {
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
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            For agent: {selectedAgent?.name}
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <FeaturePlaceholder
        icon={<EnvelopeIcon className="h-16 w-16" />}
        title="Email Marketing"
        description={`Send targeted email campaigns to your leads with ${selectedAgent?.name}`}
        features={[
          'Email template builder',
          'Personalized booking links',
          'A/B testing campaigns',
          'Send scheduling',
          'Open and click tracking',
          'Automated follow-ups',
        ]}
      />
    </div>
  )
}
