'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface Agent {
  id: string
  name: string
  tenantId: string
  publicLink: string
  knowledge: string
  linkExpiryHours: number
  createdAt: string
  updatedAt: string
}

interface AgentContextType {
  agents: Agent[]
  selectedAgentId: string | null
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  refreshAgents: () => Promise<void>
  selectAgent: (id: string) => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

const STORAGE_KEY = 'veezy_selected_agent'

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedAgent = agents.find(agent => agent.id === selectedAgentId) || null

  const fetchAgents = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agents')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.statusText}`)
      }

      const data = await response.json()
      setAgents(data)

      // Auto-select agent: restore from localStorage or pick first
      if (data.length > 0) {
        const savedAgentId = localStorage.getItem(STORAGE_KEY)
        const agentToSelect = savedAgentId && data.find((a: Agent) => a.id === savedAgentId)
          ? savedAgentId
          : data[0].id

        setSelectedAgentId(agentToSelect)
        localStorage.setItem(STORAGE_KEY, agentToSelect)
      } else {
        setSelectedAgentId(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('Error fetching agents:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
      setAgents([])
      setSelectedAgentId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const selectAgent = (id: string) => {
    setSelectedAgentId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  return (
    <AgentContext.Provider
      value={{
        agents,
        selectedAgentId,
        selectedAgent,
        isLoading,
        error,
        fetchAgents,
        refreshAgents: fetchAgents,
        selectAgent,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}
