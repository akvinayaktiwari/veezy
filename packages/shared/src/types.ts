// Shared types for Veezy AI Sales Agent

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  name: string;
  userId: string;
  configuration: AgentConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConfiguration {
  voice?: string;
  personality?: string;
  knowledgeBase?: string[];
  responseStyle?: 'formal' | 'casual' | 'professional';
}

export interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
}
