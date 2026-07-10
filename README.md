# Agentic Platform

Plataforma agentistica base para gestionar:

- agentes
- skills
- MCPs
- tools
- prompts
- providers y modelos
- routing policies
- chat operativo
- roles y RBAC

Stack actual:

- frontend: `Angular 19`
- backend: `NestJS 11`
- ORM: `Prisma`
- base de datos objetivo: `PostgreSQL`

## Estructura

- `apps/web`: panel Angular
- `apps/api`: API NestJS
- `docs/architecture.md`: blueprint tecnico
- `docs/roadmap.md`: roadmap de evolucion

## Requisitos locales

Antes de arrancar el proyecto, asegúrate de tener instalado:

1. `Node.js 20.x`
2. `npm 10.x` o superior
3. `PostgreSQL` si quieres usar persistencia real
4. `Ollama` si quieres probar modelos locales

## Instalacion local

1. Instala dependencias del frontend:

```bash
npm install --prefix apps/web
```

2. Instala dependencias del backend:

```bash
npm install --prefix apps/api
```

3. Crea el archivo de entorno del backend a partir del ejemplo:

```bash
copy apps\api\.env.example apps\api\.env
```

4. Genera el cliente de Prisma:

```bash
npm --prefix apps/api run prisma:generate
```

5. Si vas a usar PostgreSQL, crea la base de datos y ejecuta migraciones:

```bash
npm --prefix apps/api run prisma:migrate:dev
```

## Variables de entorno del backend

Archivo: `apps/api/.env`

Ejemplo base:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agentic_platform?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="1d"
```

Notas:

1. Si no configuras `DATABASE_URL`, la API puede arrancar igualmente.
2. Sin base de datos, funcionan los endpoints de lectura y catálogos demo.
3. `auth`, escrituras CRUD y persistencia real requieren PostgreSQL configurado.

## Ejecucion local

1. Arranca la API:

```bash
npm run start:api
```

2. Arranca el frontend:

```bash
npm run start:web
```

3. Accede a las aplicaciones:

- frontend: `http://localhost:4200`
- catalogo: `http://localhost:4200/catalog`
- chat: `http://localhost:4200/chat`
- API health: `http://localhost:3000/api/system/health`

## Scripts utiles

Raiz del proyecto:

```bash
npm run build
```

```bash
npm run build:web
```

```bash
npm run build:api
```

Backend:

```bash
npm --prefix apps/api run test
```

```bash
npm --prefix apps/api run test:e2e
```

```bash
npm --prefix apps/api run prisma:generate
```

Frontend:

```bash
npm --prefix apps/web run test -- --watch=false --browsers=ChromeHeadless
```

## Uso con modelos locales y remotos

### Ollama

1. Inicia `Ollama`
2. Asegúrate de tener un modelo disponible, por ejemplo `llama3`
3. Abre `http://localhost:4200/chat`
4. Selecciona:

- provider: `Ollama Local`
- modelo: `Llama 3`
- base URL: `http://localhost:11434`

### OpenAI compatible

Desde `http://localhost:4200/chat` puedes usar:

- `OpenAI`
- `OpenRouter`
- `LM Studio`
- `vLLM`
- `llama.cpp server`
- cualquier endpoint compatible con `chat/completions`

Debes indicar:

1. `baseUrl`
2. `apiKey` si aplica
3. provider y modelo

## Funcionalidad actual

Actualmente el proyecto incluye:

- dashboard inicial
- catalogo de providers y modelos
- gestion inicial de agents desde UI
- formularios para providers, modelos y routing policies
- CRUD visual base de agents con alta, edicion y borrado
- modulo inicial de skills
- relacion many-to-many entre agents y skills
- modulo inicial de tools
- relacion many-to-many entre agents y tools
- auth base con JWT y RBAC
- chat operativo contra `Ollama` y APIs compatibles con `OpenAI`
- sesiones de chat reutilizables
- resolucion de provider/model por agent y routing policy
- streaming real en chat
- historial de ejecuciones en memoria

## Endpoints principales

- `GET /api/system/health`
- `GET /api/system/blueprint`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/providers`
- `POST /api/providers`
- `GET /api/models`
- `POST /api/models`
- `GET /api/agents`
- `POST /api/agents`
- `PATCH /api/agents/:id`
- `DELETE /api/agents/:id`
- `GET /api/skills`
- `POST /api/skills`
- `PATCH /api/skills/:id`
- `DELETE /api/skills/:id`
- `GET /api/tools`
- `POST /api/tools`
- `PATCH /api/tools/:id`
- `DELETE /api/tools/:id`
- `POST /api/tools/:id/execute`
- `GET /api/routing-policies`
- `POST /api/routing-policies`
- `GET /api/chat/executions`
- `GET /api/chat/sessions`
- `POST /api/chat/sessions`
- `POST /api/chat/execute`
- `POST /api/chat/stream`

## Streaming y multi-turno

El chat soporta dos modos:

1. ejecucion normal por `POST /api/chat/execute`
2. streaming real por `POST /api/chat/stream`

Cuando se usa una `session`, el backend reutiliza el historial completo de mensajes como contexto multi-turno.

Si eliges un `agent` con `routingPolicy`, el frontend resuelve automaticamente `provider` y `model`.

## Agents, skills y tools

Desde `http://localhost:4200/catalog` ya puedes:

1. crear, editar y borrar `agents`
2. asignar multiples `skills` a un `agent`
3. asignar multiples `tools` a un `agent`
4. crear, editar y borrar `skills`
5. crear y editar `tools` iniciales para el catalogo de capacidades
6. ejecutar `tools` HTTP de prueba desde el catalogo

## Estado actual de git

El proyecto ya está inicializado como repositorio `git` local.

## Siguientes pasos sugeridos

1. Persistir `executions` en PostgreSQL
2. Añadir streaming real de respuestas
3. Crear módulo de `agents`
4. Asociar chat y ejecuciones a `routing policies`
