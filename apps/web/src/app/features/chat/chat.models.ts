import { CatalogAgent, CatalogModel, CatalogProvider } from '../catalog/catalog.models';

export interface ChatExecution {
  id: string;
  providerId: string;
  modelId: string;
  provider: string;
  model: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'error';
  sessionId?: string;
  agentId?: string;
  agent?: string;
  routingPolicyId?: string;
  prompt?: string;
  output?: string;
  error?: string;
}

export interface ChatExecutionResponse {
  session?: ChatSession | { id: string } | null;
  execution: ChatExecution;
  result: {
    output: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  } | null;
  error?: string;
}

export interface ChatCatalog {
  agents: ChatAgent[];
  providers: CatalogProvider[];
  models: CatalogModel[];
}

export interface ChatAgent extends CatalogAgent {}

export interface ChatSession {
  id: string;
  title?: string;
  agentId?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
