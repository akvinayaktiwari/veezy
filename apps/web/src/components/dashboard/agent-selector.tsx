'use client'

import { useAgent } from '@/contexts/agent-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function AgentSelector() {
  const { agents, selectedAgentId, selectAgent, isLoading } = useAgent()

  if (isLoading) {
    return <Skeleton className="h-10 w-28 sm:w-36 md:w-44" />
  }

  if (agents.length === 0) {
    return (
      <div className="flex h-10 w-28 sm:w-36 md:w-44 items-center justify-center rounded-md border border-dashed border-gray-300 text-xs text-gray-500">
        No agents
      </div>
    )
  }

  return (
    <Select value={selectedAgentId || undefined} onValueChange={selectAgent}>
      <SelectTrigger className="w-28 sm:w-36 md:w-44">
        <SelectValue placeholder="Select agent" />
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {agent.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
