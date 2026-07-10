import { CatalogModel, CatalogProvider } from '../catalog/catalog.models';

export interface ChatExecution {
  id: string;
  providerId: string;
  modelId: string;
  provider: string;
  model: string;
  startedAt: string;
  finishedAt: string;
  status: 'success' | 'error';
  prompt?: string;
  output?: string;
  error?: string;
}

export interface ChatExecutionResponse {
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
  providers: CatalogProvider[];
  models: CatalogModel[];
}
