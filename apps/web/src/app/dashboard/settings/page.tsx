'use client'

import { useAgent } from '@/contexts/agent-context'
import { Badge } from '@/components/ui/badge'
import { FeaturePlaceholder } from '@/components/dashboard/feature-placeholder'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
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
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            For agent: {selectedAgent?.name}
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <FeaturePlaceholder
        icon={<Cog6ToothIcon className="h-16 w-16" />}
        title="Agent Settings"
        description={`Configure ${selectedAgent?.name} behavior, integrations, and preferences`}
        features={[
          'AI personality customization',
          'Calendar integrations (Google, Outlook)',
          'CRM connections (Salesforce, HubSpot)',
          'Email notifications',
          'Webhook configurations',
          'Custom branding options',
        ]}
      />
    </div>
  )
}
