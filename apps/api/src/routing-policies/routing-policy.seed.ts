export const routingPolicySeed = [
  {
    id: 'seed-policy-openai-main',
    name: 'openai-main',
    isDefault: true,
    environment: 'production',
    providerId: 'seed-openai',
    primaryModelId: 'seed-gpt-4o',
    fallbackModelId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'seed-policy-local-dev',
    name: 'local-dev',
    isDefault: false,
    environment: 'development',
    providerId: 'seed-ollama',
    primaryModelId: 'seed-llama3',
    fallbackModelId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
];
