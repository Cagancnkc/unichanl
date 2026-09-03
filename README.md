# Unichanl

**Unichanl is a local AI gateway and routing layer for developers.**

Your AI coding tool hits a rate limit, quota, or provider outage. Unichanl sits between the tool and the upstream providers so your workflow keeps running.

```
Claude Code
    │
    ▼
UNICHANL LOCAL GATEWAY  (127.0.0.1:20128)
    │
    ▼
OpenRouter → Claude / GPT / Gemini / ...
```

Core principle: **the model may change, the workflow should not have to stop.**

---

## Status

This is the initial installable release (v0.1). It ships:

- The `unichanl` CLI (installable globally via `npm link` today, `npm i -g unichanl` after publish).
- A slim local gateway on `127.0.0.1:20128` with:
  - Anthropic-compatible `/v1/messages` — translates to OpenRouter (Phase 1, used by the Claude Code integration).
  - **OpenAI-compatible `/v1/chat/completions` — talks directly to Anthropic (Phase 2, new).**
- One **verified** tool integration: **Claude Code** (via the documented `ANTHROPIC_BASE_URL` env var).
- Codex and OpenCode adapters are **scaffolded but not verified end-to-end** — the CLI clearly reports them as unavailable rather than faking support.

The heavyweight DB-backed server (`src/app.ts`, Postgres + Redis + Prisma-backed sessions/usage) that this repo also contains is separate from `unichanl start`. The CLI's gateway does **not** require Postgres or Redis.

### Truthful capability statement (Phase 2)

> Unichanl can receive an OpenAI-compatible request through its local gateway and route it to Anthropic.

There is **no** OpenAI provider yet, **no** automatic fallback, **no** cross-provider session continuity, **no** multi-provider routing. Those are separate future phases.

---

## Phase 2 — Anthropic provider

Client → `POST /v1/chat/completions` → Unichanl → Anthropic API → real model response.

```
client (OpenAI-compatible)
  ↓
POST /v1/chat/completions        (127.0.0.1:20128)
  ↓
Unichanl provider abstraction
  ↓
AnthropicProvider (uses @anthropic-ai/sdk)
  ↓
api.anthropic.com
```

### Configure

Put your Anthropic API key in `.env` (never commit this file):

```bash
cp .env.example .env
# edit .env:
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5   # optional, this is the default
```

The key is loaded from the environment only — it is never written to the config file, never printed by `unichanl config show`, `unichanl status`, `/status`, or the logs.

### Verify

```bash
unichanl doctor           # checks Anthropic API key + model config
unichanl start            # binds to 127.0.0.1:20128
```

In another shell (use the local key printed by `unichanl start` or read it from the runtime file):

```bash
# Non-streaming
curl -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer $UNICHANL_LOCAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "unichanl-auto",
    "messages": [{"role":"user","content":"Reply with exactly: UNICHANL_TEST_OK"}],
    "stream": false
  }'

# Streaming (Server-Sent Events, terminates with `data: [DONE]`)
curl -N -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer $UNICHANL_LOCAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "unichanl-auto",
    "messages": [{"role":"user","content":"Write a short sentence about software development."}],
    "stream": true
  }'
```

### Tests

```bash
npm test                  # unit tests (mocked SDK, deterministic)
npm run test:integration  # real Anthropic call, only runs when ANTHROPIC_API_KEY is set
```

---

## Requirements

- Node.js 18.17 or later
- An OpenRouter API key (`OPENROUTER_API_KEY`) — this is what Unichanl uses upstream.
- (For the Claude Code integration to be useful) Claude Code installed and on your `PATH`.

---

## Install (local development)

```bash
git clone <this-repo>
cd solana-sniper-bot           # yes, misleading directory name; project is called Unichanl
cp .env.example .env
# edit .env and put your OPENROUTER_API_KEY

npm install
npm run build
npm link                       # exposes the `unichanl` binary globally

unichanl --help
```

Any time you change TypeScript sources, re-run `npm run build`. For iteration without a build step, use `npm run cli:dev -- <command>`.

---

## Quickstart

```bash
# 1. Log in (local dev stub — no hosted backend yet)
unichanl login

# 2. Start the gateway (foreground; Ctrl+C to stop)
unichanl start

# 3. In another shell:
curl http://127.0.0.1:20128/health
# → { "status": "ok", "service": "unichanl", ... }

# 4. Configure your tools
unichanl setup
# Detects installed AI coding tools, asks which to connect,
# backs up their config, and rewrites it to point at 127.0.0.1:20128.

# 5. Run Claude Code as usual — traffic now flows through Unichanl.
claude "explain this file"
```

To undo the wiring for a single tool:

```bash
unichanl disconnect claude-code
```

Your original `~/.claude/settings.json` is restored from the most recent backup in `~/.unichanl/backups/claude-code/`.

---

## Commands

| Command | What it does |
|---|---|
| `unichanl start` | Start the local gateway in the foreground on `127.0.0.1:20128`. |
| `unichanl stop` | Stop the running gateway (reads PID from `~/.unichanl/runtime.json`). |
| `unichanl status` | Show gateway state, configured providers, and each tool's connection status. |
| `unichanl setup` | Detect installed tools, prompt for selection, back up + rewrite their config. |
| `unichanl doctor` | Diagnose installation problems (Node version, port, API keys, adapter validation). |
| `unichanl login` / `unichanl logout` | Local dev auth stub — mints a random token in `~/.unichanl/auth/`. |
| `unichanl config show` | Print sanitized `~/.unichanl/config.json` (secrets redacted). |
| `unichanl disconnect <tool>` | Restore the tool's original configuration from the latest backup. |

Run `unichanl <command> --help` for per-command flags.

---

## Local file layout

Everything Unichanl writes lives under `~/.unichanl/`:

```
~/.unichanl/
├── config.json           # gateway host/port, routing default, per-integration enable flags
├── runtime.json          # PID + port of the running gateway (only present while running)
├── local-api-key         # random token the gateway accepts from local tools
├── auth/token            # local-dev auth token (from `unichanl login`)
├── logs/                 # (reserved) gateway log destination
└── backups/
    └── claude-code/
        └── 2026-09-02T10-00-00/
            ├── settings.json      # the pre-modification backup
            └── metadata.json      # backup manifest
```

**API keys are never printed by any command.** `unichanl config show` runs any string field named `*api*key*`, `*token*`, `*secret*`, `*password*`, or `*authorization*` through a redactor.

---

## How the Claude Code integration works

`unichanl setup` writes two keys under the `env` object in `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:20128",
    "ANTHROPIC_AUTH_TOKEN": "unichanl-local-<random>"
  },
  "_unichanl_managed": { "configuredAt": "…", "gatewayUrl": "…" }
}
```

`ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN` are the officially documented Claude Code settings for redirecting API traffic. The `_unichanl_managed` marker exists so `disconnect` knows what to reverse if the backup is missing.

Claude Code then sends requests to `POST http://127.0.0.1:20128/v1/messages` in the standard Anthropic Messages API shape. The gateway:

1. Validates the local API key.
2. Translates the Anthropic-shape request into OpenAI Chat Completions shape (`src/api/normalizers/anthropicNormalizer.ts`).
3. Forwards it to OpenRouter using the existing `openRouterAdapter`.
4. Translates the response (or SSE stream) back into the Anthropic shape.

**Model routing**: whatever model Claude Code asks for (`claude-3.5-sonnet`, `claude-3-opus`, …) is mapped to the corresponding OpenRouter model ID. Set `UNICHANL_DEFAULT_MODEL` to override the fallback.

---

## Adding another tool integration

Each integration implements [`ToolIntegration`](src/integrations/integration.interface.ts):

```ts
interface ToolIntegration {
  name: string;
  detect(): Promise<DetectionResult>;
  getConfiguration(): Promise<ToolConfigurationSnapshot | null>;
  canConfigureGateway(): Promise<CanConfigureResult>;
  backupConfiguration(): Promise<BackupResult | null>;
  configureGateway(gatewayUrl, localApiKey): Promise<ConfigurationResult>;
  validate(gatewayUrl, localApiKey): Promise<ValidationResult>;
  uninstall(): Promise<ConfigurationResult>;
}
```

Rules of the road:

1. **Verify the tool's real configuration mechanism first.** Never fake support.
2. If a tool has no documented way to point at a custom base URL, return `{ supported: false, reason }` from `canConfigureGateway()`. The CLI honors this and refuses to configure the tool.
3. Always call `backupFile()` (from `src/utils/backup.ts`) before mutating anything on disk.
4. `uninstall()` must restore the previous state — either by copying the backup back, or by surgically removing only the keys the adapter added.

Register the new integration in [`src/integrations/registry.ts`](src/integrations/registry.ts).

---

## Testing

```bash
npm test          # runs Node's test runner across tests/**/*.test.ts
npm run typecheck # tsc --noEmit
```

The test suite intentionally avoids the DB-backed code path so it runs on any dev machine without Postgres/Redis.

Manual smoke test (Anthropic-shape request through the gateway):

```bash
unichanl start &
LOCAL_KEY=$(cat ~/.unichanl/local-api-key)

curl -sS -X POST http://127.0.0.1:20128/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $LOCAL_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-3.5-sonnet","max_tokens":32,"messages":[{"role":"user","content":"say hi in one word"}]}'
```

If `OPENROUTER_API_KEY` is set, you get a real reply. Otherwise you get a 502 with a clear error — proof that the gateway itself is working and the failure is upstream.

---

## Known limitations

- **Only OpenRouter** is supported as the upstream provider. Native Anthropic / OpenAI / Google adapters are on the roadmap.
- **Only Claude Code** has a verified integration. Codex and OpenCode adapters exist but self-report as unverified.
- **No daemon mode yet** — `unichanl start` runs in the foreground.
- **No hosted auth backend** — `unichanl login` uses a local dev stub.
- The full DB-backed server (`npm run start`) still requires Postgres + Redis. That path is untouched by this release.

---

## Security notes

- The gateway binds to `127.0.0.1` only. It never listens on a public interface by default.
- The upstream provider API key (OpenRouter) stays in the server process environment. It is **never** given to the AI coding tool or written into any tool's configuration.
- The token the AI tool sends (`ANTHROPIC_AUTH_TOKEN`) is a *local* trust token specific to this machine, generated on first setup, stored with `0600` permissions.
- Every tool configuration write is preceded by a timestamped backup. `disconnect` reverses cleanly.
- No user input is ever passed to a shell. Detection uses `execFileSync('which'|'where', ['<binary>'])` — argument arrays, no shell interpolation.

---

## Production Deployment

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL 14+ (or Supabase PostgreSQL)
- Redis 6+ (or managed Redis service)
- `.env` file with production credentials (see `.env.example`)

### Environment Setup

```bash
# 1. Clone and install
git clone <this-repo>
cd solana-sniper-bot
npm install

# 2. Configure production environment
cp .env.example .env
# Edit .env with production values:
# - DATABASE_URL: Supabase or self-hosted PostgreSQL (pgbouncer recommended)
# - DIRECT_URL: PostgreSQL direct connection for migrations
# - REDIS_URL: Production Redis (localhost OK if on same host)
# - OPENROUTER_API_KEY: Your API key (keep secure)
# - JWT_SECRET: Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# - NODE_ENV: Set to "production"
# - ALLOWED_ORIGINS: Restrict to your domain(s), not "*"
# - PORT: 3001 (adjust as needed; ensure reverse proxy points here)
```

### Database Migration

```bash
# On first deploy, run migrations
npm run db:deploy

# Seed with initial providers and models (optional)
npm run db:seed
```

### Build and Start

```bash
# Build TypeScript
npm run build

# Start the server (in foreground or via process manager)
npm start
# Server listens on 0.0.0.0:[PORT]
```

### Process Manager (systemd or PM2)

**systemd example** (`/etc/systemd/system/unichanl.service`):
```ini
[Unit]
Description=Unichanl AI Gateway
After=network.target redis.service postgresql.service

[Service]
Type=simple
User=unichanl
WorkingDirectory=/opt/unichanl
EnvironmentFile=/opt/unichanl/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

**PM2 example**:
```bash
pm2 start dist/server.js --name "unichanl" --env production
pm2 startup
pm2 save
```

### Reverse Proxy (nginx)

```nginx
upstream unichanl {
    server 127.0.0.1:3001;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass http://unichanl;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

### Health Check

```bash
curl https://api.example.com/api/health
# → { "status": "ok", "service": "ai-gateway" }
```

### Monitoring & Observability

#### Structured Logging

Unichanl uses **pino** for JSON-structured logging. All logs include:
- `service: "ai-gateway"` — identifies the service
- `requestId` — unique per-request ID for tracing
- `timestamp` — ISO 8601 timestamp
- `level` — trace, debug, info, warn, error

**Log level configuration**:
```bash
# Development (colorized output)
NODE_ENV=development LOG_LEVEL=debug npm start

# Production (JSON output for log aggregation)
NODE_ENV=production LOG_LEVEL=info npm start
```

#### Request Timing & Metrics

Every HTTP request is logged with:
- `method`, `path`, `statusCode`, `durationMs`
- Requests >1s logged as warnings
- 4xx/5xx errors logged as warnings
- Success (2xx/3xx) logged as info

Example log line:
```
[2026-09-03T15:12:40.054Z] INFO: İstek tamamlandı
  service: "ai-gateway"
  requestId: "rswK_4Ucvd5yNuUe"
  method: "GET"
  path: "/api/health"
  statusCode: 200
  durationMs: 919
```

#### Health Endpoint

```bash
curl http://localhost:3001/api/health
```

Response includes:
- `status`: "ok" or "degraded"
- `db`: "ok" or "error" — PostgreSQL connection status
- `redis`: "ok" or "error" — Redis connection status
- `uptime`: process uptime in seconds
- `latencyMs`: health check query time
- `timestamp`: ISO 8601 timestamp

HTTP status: **200** if healthy, **503** if degraded.

#### Log Aggregation (Production)

For centralized logging, collect JSON logs from:

**Via systemd**:
```bash
journalctl -u unichanl -f --output=json | jq .
```

**Via PM2**:
```bash
pm2 logs unichanl --json
```

**Send to logging service** (e.g., Datadog, CloudWatch, ELK):
Configure your logging agent to forward stdout:
```json
{
  "service": "ai-gateway",
  "requestId": "...",
  "method": "GET",
  "path": "/api/health",
  "statusCode": 200,
  "durationMs": 919,
  "timestamp": "2026-09-03T15:12:40.054Z"
}
```

#### Database & Cache Monitoring

**PostgreSQL** (via Supabase or psql):
```sql
-- Check connection pool
SELECT * FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

**Redis** (via redis-cli):
```bash
redis-cli INFO # memory, connected_clients, commands_processed_sec
redis-cli SLOWLOG GET 10 # last 10 slow commands
```

#### Alert Thresholds (Recommended)

- 🔴 **Error rate > 5%** — alert immediately
- 🟡 **p95 latency > 2s** — warning
- 🔴 **Health check returning 503** — critical
- 🟡 **Redis connection errors** — warning
- 🔴 **Database unavailable** — critical
- 🟡 **Error log volume spike** — investigate

### Security Checklist

- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` restricted (not "*")
- [ ] `JWT_SECRET` is a strong random value
- [ ] `.env` is NOT committed to git (check `.gitignore`)
- [ ] SSL/TLS enabled on reverse proxy
- [ ] Database credentials use strong passwords
- [ ] Redis requires authentication if on shared network
- [ ] API key (`OPENROUTER_API_KEY`) stored securely, not in logs
- [ ] Regular backups of PostgreSQL database
