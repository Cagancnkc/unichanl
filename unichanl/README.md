# UNICHANL

Local AI gateway with automatic model fallback.

> Your model can change. Your work doesn't have to.

Unichanl runs on `127.0.0.1` and exposes an **OpenAI-compatible** endpoint. When your primary provider hits a rate limit, quota, timeout, or 5xx failure, Unichanl silently falls back to the next configured provider — keeping your workflow alive.

## Install

```bash
cd unichanl
npm install
npm run build
npm link       # makes `unichanl` available globally
```

## Configure

API keys come from environment variables (never persisted to config):

```bash
cp .env.example .env
# then edit .env and set:
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENAI_API_KEY=sk-...
#   GOOGLE_API_KEY=...     # optional; adapter is scaffolded in MVP
```

Model chains live in `~/.unichanl/config.json` (auto-created on first run). Default `unichanl-auto` chain:

```
anthropic:claude-sonnet-4-5  →  openai:gpt-4o  →  google:gemini-2.0-flash
```

Also available: `unichanl-primary`, `unichanl-fast`.

## Start the gateway

```bash
unichanl start                # binds 127.0.0.1:20128
unichanl start --port 3000    # override port
```

## Verify

```bash
curl http://127.0.0.1:20128/health
# → {"status":"ok","service":"unichanl","gateway":"running"}

curl http://127.0.0.1:20128/v1/models
# → {"object":"list","data":[{"id":"unichanl-auto",...},...]}

curl -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "unichanl-auto",
    "messages": [{"role":"user","content":"Say hello"}]
  }'
```

Streaming:

```bash
curl -N -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"unichanl-fast","stream":true,"messages":[{"role":"user","content":"Count to 5"}]}'
```

Session continuity — reuse a session across requests via the `X-Session-Id` header:

```bash
curl -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H 'X-Session-Id: sess-demo' \
  -H 'Content-Type: application/json' \
  -d '{"model":"unichanl-auto","messages":[{"role":"user","content":"My name is Ada."}]}'

curl -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H 'X-Session-Id: sess-demo' \
  -H 'Content-Type: application/json' \
  -d '{"model":"unichanl-auto","messages":[{"role":"user","content":"What is my name?"}]}'
```

## CLI

```bash
unichanl start          # start gateway
unichanl status         # show gateway + provider status
unichanl config show    # print active configuration
```

## Testing fallback

Run the integration test suite:

```bash
npm test
```

`tests/integration/chat-completions.test.ts` boots the full stack with two fake providers (one always-429, one always-success) and asserts that the fallback engine produces an OpenAI-shape response and records both routing events in SQLite. No real API credits burned.

## How it works

```
Client → POST /v1/chat/completions
      → Request handler (Zod validate, normalize)
      → Session manager (get/create session, append user msg)
      → Router (unichanl-{auto,primary,fast} → ordered provider chain)
      → Fallback engine
          for each step in chain:
            → Context builder (rebuild from session history)
            → Provider adapter (.chatCompletion or .streamChatCompletion)
            → on error: classifier decides fallbackable? next : throw
      → Response handler (OpenAI JSON or SSE stream)
```

Every routing decision is logged to SQLite (`~/.unichanl/unichanl.db`):

```bash
sqlite3 ~/.unichanl/unichanl.db 'SELECT * FROM routing_events ORDER BY id DESC LIMIT 10'
```

## Streaming semantics (honest MVP behavior)

- **Pre-first-chunk failure** → silent fallback to next provider on the same open connection.
- **Post-first-chunk failure** → we emit an SSE error frame `data: {"error":{"code":"STREAM_INTERRUPTED",...}}` then `[DONE]`. **We do not pretend the switch was seamless.** Resumable mid-stream switching is a v0.2 feature.

## Known MVP limitations

1. No seamless mid-stream provider switching (see above).
2. No context summarization — history truncated at last 40 messages.
3. No cost tracking / usage metering.
4. No auth — bound to `127.0.0.1` only. **Do not expose publicly.**
5. Google adapter is scaffolded only — remove `google` from your chain if you don't have a key, or wait for v0.2.
6. No cross-request circuit breaker — every request re-attempts the full chain.
7. Function-calling / tool payload is pass-through but not translated between providers.

## Next engineering priorities

1. Cross-request circuit breaker with cooldown.
2. Real Google Generative AI adapter.
3. Context summarization + per-provider token budgeting.
4. Cost tracking with per-provider $/1K token config.
5. Resumable mid-stream fallback protocol.
6. `unichanl config set` and an interactive `unichanl init` wizard.
7. Cross-provider function-calling translation.
