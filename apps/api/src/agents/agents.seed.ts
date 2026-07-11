export const agentsSeed = [
  {
    id: 'seed-agent-operations',
    name: 'Operations Copilot',
    slug: 'operations-copilot',
    description:
      'Agente generalista para soporte operativo y consultas de plataforma.',
    instructions:
      'Responde con claridad, prioriza acciones concretas y cita limitaciones si faltan datos.',
    status: 'ACTIVE',
    isEnabled: true,
    routingPolicyId: 'seed-policy-openai-main',
    skillIds: ['seed-skill-analysis', 'seed-skill-ops'],
    toolIds: ['seed-tool-status-api'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'seed-agent-local-lab',
    name: 'Local Lab Agent',
    slug: 'local-lab-agent',
    description: 'Agente para pruebas locales con modelos self-hosted.',
    instructions:
      'Trabaja con bajo coste, resume hallazgos y mantente estricto con el contexto dado.',
    status: 'ACTIVE',
    isEnabled: true,
    routingPolicyId: 'seed-policy-local-dev',
    skillIds: ['seed-skill-analysis'],
    toolIds: ['seed-tool-local-shell'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'seed-agent-support-triage',
    name: 'Support Triage Agent',
    slug: 'support-triage-agent',
    description:
      'Agente para clasificar tickets entrantes y orientar escalamiento de soporte.',
    instructions:
      'Clasifica cada caso por severidad, producto y equipo responsable antes de recomendar una respuesta.',
    status: 'ACTIVE',
    isEnabled: true,
    routingPolicyId: 'seed-policy-openai-main',
    skillIds: ['seed-skill-support-triage', 'seed-skill-analysis'],
    toolIds: ['seed-tool-ticket-api'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'seed-agent-research-assistant',
    name: 'Research Assistant',
    slug: 'research-assistant',
    description:
      'Agente para investigar documentacion, sintetizar fuentes y preparar briefs.',
    instructions:
      'Busca evidencia relevante, contrasta fuentes y resume conclusiones con referencias verificables.',
    status: 'ACTIVE',
    isEnabled: true,
    routingPolicyId: 'seed-policy-openai-main',
    skillIds: ['seed-skill-research-synthesis', 'seed-skill-analysis'],
    toolIds: ['seed-tool-docs-search'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  {
    id: 'seed-agent-devops-incident',
    name: 'DevOps Incident Agent',
    slug: 'devops-incident-agent',
    description:
      'Agente para diagnosticar incidentes, revisar health checks y coordinar mitigaciones.',
    instructions:
      'Evalua impacto, consulta señales de salud y propone pasos seguros para restaurar servicio.',
    status: 'ACTIVE',
    isEnabled: true,
    routingPolicyId: 'seed-policy-openai-main',
    skillIds: ['seed-skill-incident-troubleshooting', 'seed-skill-ops'],
    toolIds: ['seed-tool-health-checks', 'seed-tool-status-api'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
];
