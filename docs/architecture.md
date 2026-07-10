# Arquitectura Inicial

## Objetivo

Construir una plataforma para gestionar agentes, skills, MCPs, tools, prompts, chat, dashboard y roles, con soporte para multiples modelos y proveedores.

## Stack

- Frontend: Angular 19
- Backend: NestJS 11
- Base de datos objetivo: PostgreSQL
- ORM objetivo: Prisma
- Cola objetivo: Redis + BullMQ
- Tiempo real objetivo: WebSocket

## Dominios funcionales

1. `auth`
2. `users`
3. `roles`
4. `agents`
5. `skills`
6. `mcps`
7. `tools`
8. `prompts`
9. `chat`
10. `providers`
11. `models`
12. `routing-policies`
13. `executions`
14. `dashboard`
15. `audit`

## Capa multi-modelo

La plataforma debe incluir una capa de abstraccion para desacoplar agentes y prompts del proveedor real.

### Componentes

- `provider connections`: credenciales y endpoints por proveedor
- `model registry`: modelos disponibles y capacidades
- `routing policies`: reglas para seleccionar modelo principal y fallback
- `local connectors`: Ollama, LM Studio, vLLM, llama.cpp server
- `remote connectors`: OpenAI, Anthropic, OpenRouter, Azure OpenAI, Google

### Capacidades por modelo

- chat
- tool calling
- streaming
- json mode
- vision
- embeddings

## Roles iniciales

- `admin`: control total de plataforma
- `builder`: crea agentes, prompts, skills y tools
- `operator`: opera chats y ejecuciones
- `viewer`: solo consulta

## Modulo backend inicial

El backend expone actualmente un endpoint `GET /api/system/blueprint` para describir la topologia funcional del sistema y servir como contrato semilla del dashboard.

## Infraestructura ya implementada

- `PrismaModule` global
- `AuthModule` con `register`, `login`, `me`
- `JwtAuthGuard` para proteger endpoints
- `RolesGuard` y decorador `@Roles()` para RBAC
- `DatabaseService` para sembrar roles base cuando exista conexion a PostgreSQL
- `ProvidersModule` con CRUD base y fallback demo sin BD
- `ModelsModule` con CRUD base y fallback demo sin BD
- `RoutingPoliciesModule` con CRUD base y fallback demo sin BD
- `ChatModule` con ejecucion real y trazas en memoria
- `AgentsModule` con fallback demo, sesiones y resolucion por routing policy
- `SkillsModule` como primer modulo de capacidades reutilizables
- `ToolsModule` como catalogo inicial de herramientas operativas

## Runtime actual

La primera capa de ejecucion implementada usa adaptadores backend:

- `OllamaAdapter`
- `OpenAiCompatibleAdapter`

Ambos consumen un contrato comun y permiten probar la ejecucion sin acoplar el frontend a un proveedor concreto.

La iteracion actual añade:

- `streaming` sobre HTTP con eventos SSE
- sesiones multi-turno reutilizando historial
- resolucion de `provider/model` a partir de `agent -> routing policy`
- relacion `agents <-> skills` many-to-many
- relacion `agents <-> tools` many-to-many
- runtime inicial de `tools` HTTP via `POST /api/tools/:id/execute`

## Siguientes pasos recomendados

1. Anadir Prisma y schema inicial
2. Implementar auth con JWT y refresh token
3. Crear CRUD de providers/models
4. Crear CRUD de agents/prompts/tools/skills
5. Anadir chat streaming
6. Anadir trazabilidad y auditoria
