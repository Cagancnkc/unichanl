---
title: "Hangi model için hangi task? Unichanl ile otomatik yönlendirme örnekleri"
published: false
description: "Claude, GPT ve Gemini arasında task'a göre otomatik yönlendirme nasıl yapılır — kural DSL'i, curl örnekleri ve pratik config."
tags: llm, ai, cli, developer
canonical_url: https://unichanl.com/blog/hangi-model-icin
cover_image:
---

Bir yıl önce Claude Code'a geçtiğimde, ilk hafta içinde şu ağrıyı yaşadım: **kod yazması gerektiğinde Sonnet 4.7 mükemmel, ama basit bir "bu class ne yapıyor?" sorusuna cevap alırken de aynı model çalışıyordu**. Token maliyeti gereksiz şişiyor, üstelik hızlı bir refactor sırasında `o1`'in reasoning gücüne çok ihtiyacım oluyordu — ama araç sabit tek modele bağlıydı.

Bu problemin adı **"model routing"**. LiteLLM, Portkey, OpenRouter gibi araçlar bunu yıllardır sunuyor ama ya bulut, ya karmaşık config, ya da Türkiye'den ödeme sorunu.

Bu yüzden [Unichanl](https://unichanl.com) diye bir yerel gateway yazdım. Bu yazıda `unichanl` içinde task-based routing'in nasıl çalıştığını, hangi model'in hangi iş için doğru olduğunu ve **pratik curl + config örneklerini** göstereceğim.

## Model → task eşleşmesi: benim pratik kılavuzum

6 ay içinde 200+ session log'una bakarak şu tabloyu çıkardım:

| Task tipi | En iyi model | Fiyat (~1M token) | Neden |
|-----------|--------------|-------------------|-------|
| Kod yazma (>50 satır) | Claude Sonnet 4.7 | $3 / $15 | En iyi tool-use + long context reasoning |
| Kod review / refactor | Claude Opus 4.1 | $15 / $75 | Daha derin edge-case yakalama |
| Reasoning / matematik | GPT o1 | $15 / $60 | Chain-of-thought native |
| Hızlı özet, class doc | Claude Haiku | $0.25 / $1.25 | 10x ucuz, task için yeterli |
| Multimodal (görsel + text) | Gemini 2.5 Pro | $1.25 / $5 | Native image reasoning |
| Uzun context (>200k) | Gemini 2.5 Pro | $1.25 / $5 | 2M token pencere |
| Basit chat / autocomplete | GPT-4o mini | $0.15 / $0.60 | Ultra ucuz + hızlı |

Bir günde bu 7 profil arasında el ile geçmek imkansız. Buradan sonra otomatik routing gerekli.

## Routing kural DSL'i

Unichanl `routing/*.yaml` içinde YAML tabanlı kural dosyaları okur. En basit örneği:

```yaml
# routing/code-task.rules.yaml
version: 1
name: code-task
match:
  - when: "prompt.length > 500 OR context.files.count > 3"
    route: anthropic/claude-sonnet-4-7
  - when: "prompt matches /(refactor|review|audit)/i"
    route: anthropic/claude-opus-4-1
  - when: "prompt matches /(explain|what does|summarize)/i"
    route: anthropic/claude-haiku-3-5
default:
  route: anthropic/claude-sonnet-4-7
```

Bu dosyayı aktifleştirmek için:

```bash
unichanl profile activate code-task
```

Artık `127.0.0.1:20128` üzerinden gelen her istek bu kurallara göre yönlendirilir. Claude Code hâlâ Anthropic API protokolü ile konuşuyor — Unichanl arkada tercüme + routing yapıyor.

## Örnek 1: Curl ile test

Diyelim ki bir refactor isteği geliyor. Bekliyoruz ki Opus'a gitsin:

```bash
curl -X POST http://127.0.0.1:20128/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $UNICHANL_API_KEY" \
  -d '{
    "model": "auto",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Refactor this Python function to be more idiomatic:\n\ndef f(x):\n  r = []\n  for i in x:\n    if i%2==0: r.append(i*2)\n  return r"}
    ]
  }'
```

Yanıt header'ında Unichanl gerçekte hangi modele gittiğini söyler:

```
x-unichanl-routed-to: anthropic/claude-opus-4-1
x-unichanl-rule-hit: code-task#refactor
x-unichanl-cost-usd: 0.0043
```

Bu şeffaflık kritik — hangi kuralın hit olduğunu görürsen kural setini iterate edebiliyorsun.

## Örnek 2: Cost-optimized profil

Bazen "işi bitir, en ucuza gitsin" moduna geçmek istiyorum (özellikle bir agent loop'a bakarken):

```yaml
# routing/cost-optimized.rules.yaml
version: 1
name: cost-optimized
match:
  - when: "prompt.length < 200"
    route: openai/gpt-4o-mini
  - when: "prompt.length < 1000 AND !prompt matches /(refactor|design)/i"
    route: anthropic/claude-haiku-3-5
  - when: "prompt matches /(reasoning|prove|derive)/i"
    route: openai/o1-mini
default:
  route: anthropic/claude-haiku-3-5
budget:
  daily_max_usd: 5.00
  action_on_exceed: fallback_to_haiku
```

`budget` bloğu sertifikalı bir kredi kartı yakma önleyici. Günlük 5$'ı geçtiğinde otomatik Haiku'ya düşer.

## Örnek 3: Multimodal fallback

Bir Cursor session'ında ekran görüntüsü paylaşıyorum:

```yaml
# routing/multimodal.rules.yaml
version: 1
name: multimodal
match:
  - when: "message.content_types contains 'image'"
    route: google/gemini-2.5-pro
  - when: "prompt matches /(diagram|visualize|chart)/i"
    route: google/gemini-2.5-pro
default:
  route: anthropic/claude-sonnet-4-7
```

Görüntü içeren her istek Gemini'ye gider, geri kalanı Sonnet'te kalır. Cursor bu switch'i **hiç bilmiyor** — sadece `OPENAI_BASE_URL=http://127.0.0.1:20128` görüyor.

## Config: Claude Code'u bağla

`~/.claude/settings.json` içine:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:20128",
    "ANTHROPIC_API_KEY": "uni_sk_..."
  }
}
```

Cursor için Settings → Models → Custom OpenAI Base URL:

```
http://127.0.0.1:20128/openai/v1
```

Codex CLI için `~/.codex/config.toml`:

```toml
[api]
base_url = "http://127.0.0.1:20128/openai/v1"
api_key = "uni_sk_..."
```

## Neden yerel gateway?

Bu noktada "OpenRouter'da da bu var" diyebilirsiniz. Doğru, ama:

1. **Latency:** İstek → OpenRouter'a → Anthropic'e = 2 hop. Yerel gateway → 1 hop. Kod tamamlamada 200ms fark hissediliyor.
2. **KVKK:** Türkiye'de yerleşik veri sorumlusu, veri yurtdışına çıkmıyor (upstream'e giden dışında, ki o zaten kaçınılmaz).
3. **Türk kartı ödeme:** OpenRouter Stripe, benim MasterCard'ım her ay 2 kez reddedildi. Unichanl Iyzico + Türk kartı destekliyor.
4. **Debug:** Yerel loglara direkt bakabiliyorsun. `unichanl logs --tail --routed anthropic/claude-opus-4-1`.

## Denemek isterseniz

```bash
curl -fsSL https://unichanl.com/install.sh | sh
unichanl login
unichanl topup 5   # $5 minimum
export ANTHROPIC_BASE_URL=http://127.0.0.1:20128
claude
```

Konfigürasyon örnekleri: [github.com/unichanl/unichanl-starter](https://github.com/unichanl/unichanl-starter)

---

*Disclosure: Ben Unichanl'ın kurucusuyum. Aşağıya yorum bırakın, hangi task için hangi model'i tercih ettiğinizi merak ediyorum — kural setine ekleriz.*
