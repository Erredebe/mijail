export type ProviderKind = 'REMOTE' | 'LOCAL';

export type ModelCapability =
  | 'CHAT'
  | 'TOOL_CALLING'
  | 'STREAMING'
  | 'JSON_MODE'
  | 'VISION'
  | 'EMBEDDINGS';

export interface CatalogModel {
  id: string;
  name: string;
  slug: string;
  externalModelId: string;
  capabilities: ModelCapability[];
  contextWindow?: number | null;
  supportsStructuredIo: boolean;
  isEnabled: boolean;
  providerConnectionId?: string;
}

export interface CatalogProvider {
  id: string;
  name: string;
  slug: string;
  provider: string;
  kind: ProviderKind;
  baseUrl?: string | null;
  apiKeyMasked?: string | null;
  isEnabled: boolean;
  models: CatalogModel[];
}

export interface RoutingPolicy {
  id: string;
  name: string;
  isDefault: boolean;
  environment?: string | null;
  providerId: string;
  primaryModelId: string;
  fallbackModelId?: string | null;
  provider?: Pick<CatalogProvider, 'id' | 'name' | 'slug' | 'provider' | 'kind'>;
  primaryModel?: Pick<CatalogModel, 'id' | 'name' | 'slug' | 'externalModelId'>;
  fallbackModel?: Pick<CatalogModel, 'id' | 'name' | 'slug' | 'externalModelId'> | null;
}
