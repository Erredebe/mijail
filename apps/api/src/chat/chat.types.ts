export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatExecutionRequest = {
  providerId: string;
  modelId: string;
  provider: string;
  providerName: string;
  baseUrl?: string | null;
  apiKey?: string;
  externalModelId: string;
  systemPrompt?: string;
  prompt?: string;
  messages: ChatMessage[];
};

export type ChatExecutionResult = {
  output: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
};

export type ChatStreamChunk = {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: string;
};

export type ExecutionRecord = {
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
};

export type ChatSessionRecord = {
  id: string;
  title?: string;
  agentId?: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};
