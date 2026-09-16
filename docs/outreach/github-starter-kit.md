# unichanl-starter — Public Repo Plan

Amaç: `github.com/unichanl/unichanl-starter` altında, herkesin 60 saniyede Unichanl'ı deneyebilmesi için hazır bir starter kit yayınlamak. Bu repo, hem SEO backlink kaynağı hem de developer ergonomics + trust sinyali.

## Neden ayrı bir repo?

- **Trust signal:** "GitHub'da bir starter kit var mı?" sorusuna evet demek satın alma sürtüşmesini düşürüyor.
- **AI görünürlük:** GitHub, ChatGPT ve Copilot'un en sık crawl ettiği kaynaklardan biri. `unichanl` string'i README'de + code sample'larında yer alırsa "how to use Claude Code with a proxy" gibi sorgularda AI cevaplarına düşer.
- **Onboarding shortcut:** Kullanıcı `git clone` yapıp `./quickstart.sh` çalıştırdığında Claude Code, Cursor, Codex, Gemini için config'ler kendi kendine yerleşir.
- **Backlink:** README'de `https://unichanl.com` linki + Product Hunt / TAAFT badge'leri.

## Repo file layout

```
unichanl-starter/
├── README.md                          ← ana giriş, çok görsel
├── LICENSE                            ← MIT
├── .env.example                       ← UNICHANL_API_KEY, base URL, log level
├── quickstart.sh                      ← curl install + config setup one-liner
├── quickstart.ps1                     ← Windows PowerShell eşdeğeri
├── examples/
│   ├── claude-code/
│   │   ├── README.md                  ← ANTHROPIC_BASE_URL setup
│   │   ├── .claude/settings.json      ← project-scoped config
│   │   └── .env.example
│   ├── cursor/
│   │   ├── README.md                  ← Cursor "OpenAI Base URL" override
│   │   └── cursor-settings.json
│   ├── codex/
│   │   ├── README.md                  ← OpenAI Codex CLI base override
│   │   └── config.toml
│   ├── gemini/
│   │   ├── README.md                  ← Gemini CLI base URL
│   │   └── config.yaml
│   ├── aider/
│   │   ├── README.md
│   │   └── .aider.conf.yml
│   └── raw-curl/
│       ├── chat.sh                    ← curl -X POST /v1/messages ...
│       └── streaming.sh
├── routing/
│   ├── README.md                      ← routing rule DSL örneği
│   ├── code-task.rules.yaml
│   ├── reasoning-task.rules.yaml
│   └── cost-optimized.rules.yaml
├── scripts/
│   ├── health-check.sh                ← curl /health
│   ├── list-models.sh
│   └── show-balance.sh
├── .github/
│   ├── workflows/
│   │   └── smoke-test.yml             ← CI: quickstart.sh idempotent mi
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
└── docs/
    ├── troubleshooting.md
    ├── kvkk-and-privacy.md
    └── faq.md
```

## Starter README skeleton

Aşağıdaki markdown README'nin ilk sürümü — buradaki her bölüm tam metin ile doldurulmalı, kısaltma yapılmadan pushlanır.

```markdown
# unichanl-starter

> Türk kartıyla Claude, GPT, Gemini — tek CLI, 60 saniye kurulum.

[![Unichanl](https://unichanl.com/badge.svg)](https://unichanl.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Product Hunt](https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=XXXXX)](https://www.producthunt.com/posts/unichanl)

[Unichanl](https://unichanl.com), yerel makinenizde çalışan bir AI ağ geçidi
CLI'dır. Claude Code, Cursor, Codex ve Gemini gibi araçları tek `127.0.0.1:20128`
endpoint'i üzerinden çalıştırırsınız. Bu repo, dakikalar içinde başlamanız
için tam bir örnek kit sunar.

## 60 saniye kurulum

\`\`\`bash
curl -fsSL https://unichanl.com/install.sh | sh
git clone https://github.com/unichanl/unichanl-starter
cd unichanl-starter
cp .env.example .env       # UNICHANL_API_KEY'i düzenle
./quickstart.sh
\`\`\`

Windows için:

\`\`\`powershell
iwr -useb https://unichanl.com/install.ps1 | iex
git clone https://github.com/unichanl/unichanl-starter
cd unichanl-starter
Copy-Item .env.example .env
./quickstart.ps1
\`\`\`

## Neler var?

| Klasör | Ne için? |
|--------|----------|
| `examples/claude-code/` | Claude Code'u Unichanl'a bağlar. `ANTHROPIC_BASE_URL` ile tek satır. |
| `examples/cursor/` | Cursor IDE için OpenAI Base URL override + custom model config. |
| `examples/codex/` | Codex CLI için `config.toml` üzerinden gateway ayarı. |
| `examples/gemini/` | Gemini CLI için base URL override. |
| `examples/aider/` | aider pair programming aracı için `.aider.conf.yml`. |
| `examples/raw-curl/` | Direkt REST API için hazır curl örnekleri. |
| `routing/` | Model routing kural DSL örnekleri (code, reasoning, cost). |
| `scripts/` | Health check, model list, bakiye görüntüleme. |

## Örnek: Claude Code'u Unichanl'a bağla

\`\`\`bash
export ANTHROPIC_BASE_URL="http://127.0.0.1:20128"
export ANTHROPIC_API_KEY="$UNICHANL_API_KEY"
claude
\`\`\`

Bu kadar. Claude Code artık Unichanl gateway'i üzerinden çalışıyor. Bakiyeniz
kadar konuşursunuz, rate-limit yok.

## Neden Unichanl?

- 💳 **Türk kartıyla topup:** Anthropic / OpenAI'ın Türkiye ödeme sorunu yok.
- ⚡ **Pay-as-you-go:** Aylık abonelik yok, minimum 5$, kullandığın kadar öde.
- 🔒 **KVKK uyumlu:** İstek/yanıt kalıcı diske yazılmaz, yurtiçi işleme.
- 🎯 **Otomatik model yönlendirme:** Code → Sonnet, reasoning → o1, quick → Haiku.
- 🖥️ **Yerel:** Bulut değil, kendi makinende. `127.0.0.1:20128`.

## SSS

Bkz. [`docs/faq.md`](docs/faq.md).

## KVKK / Privacy

Bkz. [`docs/kvkk-and-privacy.md`](docs/kvkk-and-privacy.md).

## Katkı

Issue açın, PR gönderin. Türkçe / İngilizce ikisi de OK.

## Lisans

MIT.
```

## Örnek `.env.example` içeriği

```bash
# Unichanl API key — https://unichanl.com/dashboard/keys'ten al
UNICHANL_API_KEY=uni_sk_your_key_here

# Gateway endpoint (yerel default)
UNICHANL_BASE_URL=http://127.0.0.1:20128

# Log level: debug | info | warn | error
UNICHANL_LOG_LEVEL=info

# Opsiyonel: default routing profili (code | reasoning | cost)
UNICHANL_DEFAULT_PROFILE=code
```

## `quickstart.sh` iskeleti

```bash
#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "❌ .env yok. .env.example'ı kopyalayıp API key'ini yaz."
  exit 1
fi

# shellcheck disable=SC1091
source .env

echo "🩺 Unichanl gateway health check..."
curl -fsS "${UNICHANL_BASE_URL}/health" >/dev/null || {
  echo "❌ Gateway ayakta değil. 'unichanl start' çalıştır."
  exit 1
}

echo "✅ Gateway ayakta."
echo ""
echo "🎯 Claude Code için:"
echo "   export ANTHROPIC_BASE_URL=$UNICHANL_BASE_URL"
echo "   export ANTHROPIC_API_KEY=$UNICHANL_API_KEY"
echo ""
echo "🎯 Cursor için: examples/cursor/README.md"
echo "🎯 Codex için:  examples/codex/README.md"
echo "🎯 Gemini için: examples/gemini/README.md"
echo ""
echo "💰 Bakiye: $(./scripts/show-balance.sh)"
```

## Repo tag'leri (topics)

```
ai-gateway
llm-router
claude-code
cursor-ide
codex-cli
gemini
openrouter-alternative
litellm-alternative
portkey-alternative
pay-as-you-go
self-hosted
kvkk
turkey
cli
developer-tools
```

## Launch checklist

- [ ] `README.md` tam metin (yukarıdaki skeleton'un final versiyonu)
- [ ] 5 örnek klasör: claude-code, cursor, codex, gemini, aider — hepsinde çalışan config
- [ ] `quickstart.sh` + Windows `quickstart.ps1`
- [ ] CI smoke test (GitHub Actions: `unichanl --version` ve health check)
- [ ] `docs/faq.md` en az 15 SSS
- [ ] `docs/kvkk-and-privacy.md` KVKK maddelerini açıklayan sayfa
- [ ] LICENSE (MIT)
- [ ] Repo topics doldurulmuş
- [ ] Description: "Yerel AI gateway — Claude, GPT, Gemini için tek CLI starter kit."
- [ ] Homepage URL: https://unichanl.com
- [ ] Ilk release tag: v0.1.0
- [ ] README'de PH badge (launch sonrası)
- [ ] README top: `⭐ Beğendiyseniz star atın` çağrısı

## Ölçüm

- Star sayısı (haftalık)
- Clone / traffic (GitHub Insights → Traffic)
- Referring sites (Insights → Traffic → Referring sites)
- Fork sayısı
- Issue açan unique kullanıcı sayısı
