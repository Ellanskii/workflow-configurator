# Workflow Configurator

A microfrontend application for visually building and editing supply-chain workflows (procurement → customs → delivery → warehouse).

## Architecture

Built on [single-spa](https://single-spa.js.org/) with two independent microfrontends:

| Package | Framework | State | Port |
|---|---|---|---|
| `mfe-table` | Vue 3 + Composition API | Pinia | 9001 |
| `mfe-diagram` | React 19 + hooks | Redux Toolkit | 9002 |
| `root-config` | vanilla JS | — | 9000 |
| `backend` | Node.js + Express | — | 3000 |

MFEs communicate via typed custom DOM events on `window` (`workflow:step-selected`, `workflow:step-created`, etc.).

## Prerequisites

- Node.js >= 18
- npm

## Local Development

Start services in this order:

```bash
# 1. Backend
cd backend && npm install && npm run dev

# 2. Table MFE
cd mfe-table && npm install && npm run dev

# 3. Diagram MFE
cd mfe-diagram && npm install && npm run dev

# 4. Root config (orchestrator)
cd root-config && npm install && npm run dev
```

Open [http://localhost:9000](http://localhost:9000).

Swagger UI: [http://localhost:3000/swagger](http://localhost:3000/swagger)

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/workflow/get` | Fetch workflow data |
| `POST` | `/workflow/createStep` | Create a step |
| `POST` | `/workflow/deleteStep` | Delete a step |
| `POST` | `/workflow/changeStepName` | Rename a step |
| `POST` | `/workflow/changeStepXY` | Update step coordinates |

Workflow data is stored in `backend/data/wf1.json`.

## Tests

Run from the respective package directory:

```bash
npm run test:unit      # Vitest (unit tests)
npm run test:e2e       # Cypress headless
npm run test:e2e:open  # Cypress interactive
npm run typecheck      # TypeScript check
npm run lint           # ESLint
```

## Production (Docker)

Requires Docker and Docker Compose.

```bash
docker compose up -d --build
```

This builds two images:

- **backend** — Node.js API server
- **frontend** — nginx serving all three built MFEs + proxying `/workflow/*` to the backend

The Docker network MTU is set to `1350` to avoid packet fragmentation behind VPN tunnels with reduced MTU.

Workflow data is persisted in a named Docker volume (`wf_data`).

### Deploying with Coolify

1. Create a new resource → **Private/Public Repository**
2. Point it to this repository
3. Coolify will detect `docker-compose.yml` automatically
4. Set your domain in the service settings — Coolify handles HTTPS via Let's Encrypt

## Project Structure

```
/
├── backend/          # Express REST API, data in data/wf1.json
├── root-config/      # single-spa orchestrator, HTML shell
├── mfe-table/        # Vue 3 table MFE
│   ├── src/
│   │   ├── api/          # axios client
│   │   ├── components/   # WorkflowTable component + SCSS module
│   │   ├── stores/       # Pinia store
│   │   └── events.ts     # cross-MFE custom events
│   └── cypress/e2e/
├── mfe-diagram/      # React 19 diagram MFE
│   ├── src/
│   │   ├── api/          # axios client
│   │   ├── components/   # WorkflowDiagram component + SCSS module
│   │   ├── store/        # Redux Toolkit slice
│   │   └── events.ts     # cross-MFE custom events
│   └── cypress/e2e/
├── nginx/            # nginx config for production
├── Dockerfile.frontend
└── docker-compose.yml
```
