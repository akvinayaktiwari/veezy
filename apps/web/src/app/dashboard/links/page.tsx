'use client'

import { useAgent } from '@/contexts/agent-context'
import { Badge } from '@/components/ui/badge'
import { FeaturePlaceholder } from '@/components/dashboard/feature-placeholder'
import { LinkIcon } from '@heroicons/react/24/outline'

export default function LinksPage() {
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
          <h1 className="text-3xl font-bold">Booking Links</h1>
          <p className="text-muted-foreground mt-1">
            For agent: {selectedAgent?.name}
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <FeaturePlaceholder
        icon={<LinkIcon className="h-16 w-16" />}
        title="Custom Booking Links"
        description={`Create unique booking links for different campaigns and channels for ${selectedAgent?.name}`}
        features={[
          'Multiple booking links per agent',
          'Campaign-specific links',
          'UTM parameter tracking',
          'Custom link expiry times',
          'QR code generation',
          'Link performance analytics',
        ]}
      />
    </div>
  )
}
