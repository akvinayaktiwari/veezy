'use client'

import { useAgent } from '@/contexts/agent-context'
import { Badge } from '@/components/ui/badge'
import { FeaturePlaceholder } from '@/components/dashboard/feature-placeholder'
import { BookOpenIcon } from '@heroicons/react/24/outline'

export default function KnowledgePage() {
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
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            For agent: {selectedAgent?.name}
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <FeaturePlaceholder
        icon={<BookOpenIcon className="h-16 w-16" />}
        title="Knowledge Management"
        description={`Manage knowledge base content for ${selectedAgent?.name} to use during calls`}
        features={[
          'Upload documents (PDF, DOCX)',
          'Add images and videos',
          'Web page scraping',
          'FAQ management',
          'Content versioning',
          'Search and organize content',
        ]}
      />
    </div>
  )
}
