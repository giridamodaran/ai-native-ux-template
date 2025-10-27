
# ai-native-ux-template

**AI‑native, conversational app template** featuring:

- **Claude** as the multimodal assistant (tool‑use)
- **MCP servers** (Model Context Protocol) to expose your domain tools
- **Chat backend** that forwards tool calls to MCP (STDIO or HTTP)
- **iOS App Intents** / **Android App Actions** samples to deep‑link features
- **Docker** (single container & multi‑arch), **GitHub Actions CI**, and **Claude Desktop .mcpb** bundling
- Optional **on‑device AI** (Android LiteRT + Qualcomm QNN delegate)

> Use this repo as a template to spin up a production‑ready stack for AI‑driven UX.

---

## Table of contents

- #architecture  
- #repo-structure  
- #prerequisites  
- #quick-start-local  
- #environment-variables  
- #run-with-docker  
  - #single-container-stdio-mcp  
  - #two-containers-http-mcp  
  - #multi-arch-builds-with-makefile  
- #github-actions-multi-arch-cicd-to-ghcr  
- #claude-desktop-extension-mcpb  
- #deployment  
  - #render  
  - #vercel  
- #mcp-transport-modes  
- #ios--android-samples  
- #troubleshooting  
- #license

---

## Architecture

```mermaid
flowchart LR
  subgraph Client Surfaces
    A1[Web: Command Palette + Chat]
    A2[iOS App
(App Intents)]
    A3[Android App
(App Actions/Shortcuts)]
  end

  subgraph Assistant & Orchestration
    B1[Claude (API/Desktop)
Multimodal LLM]
    B2[MCP Host/Client
(Claude Desktop or custom)]
  end

  subgraph Tooling via MCP
    C1[MCP Server: Booking API
(create_booking, cancel_booking)]
    C2[MCP Server: Messaging
(send_guest_message, notify_ops)]
    C3[MCP Server: Filesystem / Reports]
  end

  subgraph App & Data
    D1[Domain Microservices
(Reservations, Pricing, Guests)]
    D2[DB/Events/Queues]
  end

  subgraph Privacy, Governance & Logs
    E1[Action Logs & Audit Trail]
    E2[Policy / RBAC / PII redaction]
    E3[Transparency labels & provenance]
  end

  subgraph Optional On‑device AI
    F1[Android: LiteRT + QNN Delegate
(NPU inference)]
  end

  A1 -->|prompt| B1
  A2 -->|intent| B1
  A3 -->|intent| B1
  B1 <-->|tools| B2
  B2 <-->|JSON-RPC| C1
  B2 <-->|JSON-RPC| C2
  B2 <-->|JSON-RPC| C3
  C1 --> D1 --> D2
  C2 --> D1
  C3 --> D2
  B2 --> E1
  D1 --> E1
  E1 --> E2
  E1 --> E3
  A3 -.local models.-> F1
```

**MCP modes**  
- **STDIO** (local/desktop/single container): assistant spawns MCP via child process over stdio.  
- **HTTP** (multi‑service/cloud): MCP runs as an HTTP service; assistant connects over the network.

---

## Repo structure

```
ai-native-ux-template/
  README.md
  LICENSE
  .gitignore
  .env.example
  Makefile
  docker-compose.yml
  docs/architecture.md
  packages/mcp-bookings/        # MCP server (TypeScript)
  apps/chat-backend/            # Chat backend (Node) — Claude tool_use ↔ MCP
  examples/                     # Config & mobile samples
  .github/workflows/            # Multi-arch CI
```

---

## Prerequisites

- **Node.js 18+**  
- **npm**  
- **Docker 24+** with **Buildx** for multi‑arch (optional but recommended)  
- A valid **Claude (Anthropic) API key** for runtime

---

## Quick start (local)

### 1) MCP server (TypeScript)
```bash
cd packages/mcp-bookings
npm install
npm run build
npm start
```

### 2) Claude Desktop (no code)
Add this to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "bookings": {
      "command": "npx",
      "args": ["-y", "file:packages/mcp-bookings"]
    }
  }
}
```
Restart Claude Desktop → your MCP tools appear under **Tools**.

### 3) Chat backend (programmatic)
```bash
cd ../../apps/chat-backend
npm install
cp .env.example .env   # set ANTHROPIC_API_KEY, API_URL, API_TOKEN
npm run dev
```

Test:
```bash
curl -X POST http://localhost:8787/chat   -H 'Content-Type: application/json'   -d '{"prompt":"Create a booking for alex@example.com 2026-01-10 to 2026-01-12, Deluxe"}'
```

---

## Environment variables

Backend (`apps/chat-backend/.env`):
```ini
ANTHROPIC_API_KEY=replace-me
ANTHROPIC_MODEL=claude-3-7-sonnet

# Your domain API
API_URL=https://api.example.com
API_TOKEN=replace-me

# MCP transport selection
# stdio: backend spawns MCP from file path (default)
# http: backend connects to MCP over network
MCP_TRANSPORT=stdio

# stdio mode command & args (JSON array)
MCP_COMMAND=node
MCP_ARGS=["/app/packages/mcp-bookings/build/index.js"]

# http mode URL (if MCP is a separate service)
MCP_URL=http://mcp:8000/
```

> The backend reads these envs—no post‑build patching required.

---

## Run with Docker

### Single container (STDIO MCP)

Build & run:
```bash
docker build -f apps/chat-backend/Dockerfile -t chat-backend-stdio .
docker run --rm -p 8787:8787   -e ANTHROPIC_API_KEY=your_key   -e API_URL=https://api.example.com   -e API_TOKEN=replace-me   -e MCP_TRANSPORT=stdio   -e MCP_COMMAND=node   -e MCP_ARGS='["/app/packages/mcp-bookings/build/index.js"]'   chat-backend-stdio
```

### Two containers (HTTP MCP)

Switch MCP server to **HTTP transport** (see `packages/mcp-bookings/src/index.ts` comments) and:

```bash
# MCP
docker build -f packages/mcp-bookings/Dockerfile -t mcp-bookings:http packages/mcp-bookings
docker run --rm -p 8000:8000 mcp-bookings:http

# Backend (pointing to HTTP MCP)
docker run --rm -p 8787:8787   -e ANTHROPIC_API_KEY=your_key   -e API_URL=https://api.example.com   -e API_TOKEN=replace-me   -e MCP_TRANSPORT=http   -e MCP_URL=http://host.docker.internal:8000/   chat-backend-stdio
```

### Multi‑arch builds with Makefile

```bash
make builder-init
make buildx-mcp
make buildx-chat

# or push to GHCR
make push-mcp  REGISTRY=ghcr.io/<owner>/ TAG=v0.1.0
make push-chat REGISTRY=ghcr.io/<owner>/ TAG=v0.1.0
```

---

## GitHub Actions: Multi‑arch CI/CD to GHCR

`.github/workflows/build-multiarch.yml`:

- Builds **both images** on PRs (no push)
- Pushes images on merges to **main** / on **tags** to **GHCR**
- Tags: `latest`, `sha`, semver (`vX.Y.Z`, `X.Y`)

**Setup**
1. Repo **Settings → Actions → General → Workflow permissions** → **Read and write**.
2. The workflow sets `packages: write` for GHCR.

Images will appear as:

```
ghcr.io/<owner>/ai-native-ux-template-mcp-bookings:<tag>
ghcr.io/<owner>/ai-native-ux-template-chat-backend:<tag>
```

---

## Claude Desktop Extension (.mcpb)

Package your MCP server as a **one‑click** extension:

```bash
make mcpb
# Output: dist/mcp-bookings.mcpb
```

Double‑click `.mcpb` on a machine with Claude Desktop installed to add the extension.  
Customize with `MCP_NAME`, `MCP_DISPLAY_NAME`, `MCP_DESCRIPTION`, `MCP_VERSION`.

---

## Deployment

### Render

**A — Single container (STDIO MCP)**  
- Web Service → Dockerfile: `apps/chat-backend/Dockerfile`  
- Port: **8787**  
- Env:
  - `ANTHROPIC_API_KEY`
  - `API_URL`, `API_TOKEN`
  - `MCP_TRANSPORT=stdio`
  - `MCP_COMMAND=node`
  - `MCP_ARGS=["/app/packages/mcp-bookings/build/index.js"]`

**B — Two services (HTTP MCP)**  
1) Private service for MCP (`packages/mcp-bookings/Dockerfile`, `PORT=8000`)  
2) Web service for backend pointing to `MCP_URL=http://<mcp-service-host>:8000/`

### Vercel

Use Docker deployment for **chat-backend** only, with **HTTP MCP** hosted elsewhere (Render/VM):

- `MCP_TRANSPORT=http`, `MCP_URL=https://<mcp-host>:8000/`
- `ANTHROPIC_API_KEY`, `API_URL`, `API_TOKEN`
- `EXPOSE 8787` in Dockerfile is already set.

> If you prefer Vercel Serverless Functions, migrate `apps/chat-backend/src/server.ts` into an API route and refactor HTTP streaming; MCP must remain **HTTP** and hosted externally.

---

## MCP transport modes

- **STDIO**: client spawns MCP as a child process; fastest for local/desktop/single container; no port exposure.
- **HTTP**: MCP runs as a network service; ideal for cloud/K8s and independent scaling; needs TLS/auth & port mgmt.

---

## iOS / Android samples

- `examples/ios/CreateOfferIntent.swift`: minimal **App Intent** (Siri/Shortcuts action).  
- `examples/android/shortcuts.xml`: **App Actions** (`OPEN_APP_FEATURE`) with parameters.

---

## Troubleshooting

- **No tool calls**: ensure MCP server is running; check backend logs.  
- **STDIO path issues**: make sure `MCP_ARGS` points to an **absolute path** inside the Docker image.  
- **HTTP connection fails**: verify service DNS/port, container network, and `MCP_URL`.  
- **Buildx slow on first run**: cache warms; subsequent builds are faster (`type=gha` cache).  

---

## License

@giridamodaran 

MIT © 2025
