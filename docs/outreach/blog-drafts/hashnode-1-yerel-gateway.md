---
title: "Yerel AI gateway ile Claude Code rate-limit çözümü"
subtitle: "5 saatlik pencere biterken 'usage limit reached' görmekten yorulduysanız — bu benim çözümüm."
tags: llm, claude, developer-tools, cli, ai
slug: yerel-ai-gateway-claude-code-rate-limit
canonical: https://unichanl.com/blog/yerel-gateway-rate-limit
---

Claude Code'u ilk defa deneyimlediğinizde büyülüsünüz. `claude` yazıyorsunuz, kod yazıyor, refactor yapıyor, hatta test bile çalıştırıyor. Sonra 4.5 saatlik yoğun bir çalışma günü gelene kadar. Ve sonra:

> `usage limit reached — please wait 43 minutes before your next request`

Bu, Claude'un 5 saatlik yuvarlanan pencere limitidir ve Pro plan üyeleri için gerçek bir üretkenlik katilidir. Bu yazıda **yerel bir AI gateway ile bu problemi neden ve nasıl çözdüğümü**, ve arada elde ettiğim bonus faydaları anlatacağım.

## Problem: sabit "pencere" limitleri

Anthropic'in Pro plan'i şöyle çalışır:
- 5 saatlik yuvarlanan pencere
- Bu pencere içinde ~200 mesaj (ortalama uzunluk için)
- Pencere dolduğunda tam yenilenene kadar bekleyeceksin

Sorunlar:
1. **Öngörülemez:** Bugünkü mesajlarım daha uzun olursa yarım günde limite girerim.
2. **Sabit tavan:** Ne kadar iş olursa olsun tavan aynı.
3. **Team plan pahalı:** Solo geliştirici için $200/ay overkill.
4. **Türkiye'den ödeme sorunu:** Bu ayrı bir başlık.

## Alternatif: doğrudan API + kendi rate management'ın

`ANTHROPIC_API_KEY` ile doğrudan API kullanmak, "5 saatlik pencere" limitini kaldırır. Yerine gerçek RPM/TPM limitleri gelir ki bunlar çok daha yumuşak. Ama:

- Anthropic doğrudan API için Türk kartını genelde reddediyor (sık bildirilen bir sorun).
- Kendi kullanımını takip etmen gerekiyor (dashboard var ama minimal).
- Model seçimi + fallback yok.

## Çözüm: yerel gateway (`unichanl`)

[Unichanl](https://unichanl.com), makinende çalışan slim bir HTTP gateway'dir. `127.0.0.1:20128` üzerinde ayaklanır ve Anthropic protokolüne uygun (ve OpenAI protokolüne uygun) istekleri kabul edip upstream'e proxy'ler.

Kritik nokta: **upstream'e Anthropic'in kendi API'sini kullanır, ama ödeme kısmını Unichanl bakiyenden çeker.**

```
Claude Code → 127.0.0.1:20128 → Anthropic API
                    ↓
              Unichanl balance
              (Türk kartı topup)
```

Yani:
- 5 saatlik pencere limitleri: **YOK** (çünkü Pro sub değil, doğrudan API'nin RPM limitleri geçerli)
- Ödeme sorunu: **YOK** (Türk kartı → Unichanl → Anthropic)
- KVKK: **VAR** (yurtiçi işleme, kalıcı loglama yok)

## Kurulum: 60 saniye

```bash
# 1. Install
curl -fsSL https://unichanl.com/install.sh | sh

# 2. Login (browser açılır)
unichanl login

# 3. Topup — minimum $5
unichanl topup 5

# 4. Gateway'i başlat
unichanl start
```

Şimdi Claude Code'u bağla:

```bash
export ANTHROPIC_BASE_URL="http://127.0.0.1:20128"
export ANTHROPIC_API_KEY="$(unichanl key show)"
claude
```

Bu kadar. Claude Code ne olduğunu bilmiyor — kendi normal API'siymiş gibi çalışıyor.

## Kalıcı olsun: `~/.claude/settings.json`

Her terminal'de env değişkeni set etmemek için Claude Code'un kendi settings dosyasını kullan:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:20128",
    "ANTHROPIC_API_KEY": "uni_sk_..."
  }
}
```

Ya da project bazlı: `.claude/settings.json` içine aynı bloğu koy. Repo-level override, global config'i yener.

## Health check: gateway ayakta mı?

```bash
curl -s http://127.0.0.1:20128/health | jq
```

Beklenen çıktı:

```json
{
  "status": "ok",
  "version": "0.4.2",
  "upstream": {
    "anthropic": "reachable",
    "openai": "reachable",
    "google": "reachable"
  },
  "balance_usd": 4.87,
  "uptime_s": 12043
}
```

Balance kritik — düştüğünde `unichanl topup 5` ile yenilersin.

## Bonus 1: Auto-model routing

Tek gateway olduğu için, aynı zamanda routing kararlarını burada verebilirsin. Örneğin uzun refactor'lar Opus'a, açıklama sorguları Haiku'ya gitsin:

```yaml
# ~/.unichanl/routing.yaml
match:
  - when: "prompt matches /(refactor|architecture|design)/i"
    route: anthropic/claude-opus-4-1
  - when: "prompt matches /(explain|summarize|what does)/i"
    route: anthropic/claude-haiku-3-5
default:
  route: anthropic/claude-sonnet-4-7
```

Claude Code hâlâ "Anthropic'e konuşuyorum" sanıyor. Arkada Sonnet ↔ Opus ↔ Haiku otomatik geçiyor. Maliyetim ~%40 düştü, hız aynı.

## Bonus 2: Cost visibility

```bash
unichanl cost --today
```

```
Today's usage:
  anthropic/claude-sonnet-4-7:  1.2M tokens  →  $2.34
  anthropic/claude-haiku-3-5:   500k tokens  →  $0.18
  openai/gpt-4o-mini:            80k tokens  →  $0.02
  ─────────────────────────────────────────────────
  TOTAL                                      →  $2.54
```

Her session için hangi model, hangi ücret. Anthropic dashboard'unda böyle bir seviye yok.

## Bonus 3: Multi-tool support

Claude Code'u bağladığın gibi:
- **Cursor:** Settings → Models → Custom OpenAI Base URL: `http://127.0.0.1:20128/openai/v1`
- **Codex CLI:** `~/.codex/config.toml` içinde `base_url` set.
- **Gemini CLI:** `GEMINI_API_BASE=http://127.0.0.1:20128/google/v1beta` env'i.
- **aider:** `.aider.conf.yml` içinde `openai-api-base` set.

Hepsi aynı bakiyeden ödeme yapıyor. Cursor kullanırken $2 harcarsam, Claude Code için bakiyem $2 azalıyor. Tek cüzdan.

## Bonus 4: KVKK & privacy

Unichanl backend'i Türkiye'de yerleşik ve KVKK uyumlu. İstek/yanıt gövdeleri **kalıcı diske yazılmaz**. Sadece metadata (token sayısı, hangi model, timestamp) 90 gün tutulur, sonra silinir.

Bu, kurumsal ortamda Claude Code kullanmak isteyen Türk ekipleri için kritik bir fark.

## Sınırlamalar (dürüst kısım)

- **RPM limit hâlâ var:** Anthropic'in direct API'sinde de RPM limitleri var (Tier 1: 50 RPM, Tier 4: 4000 RPM). Ama pencere limiti kadar can sıkıcı değil.
- **Bakiye takibi senin sorumluluğun:** Auto-topup şu an yok (yakında geliyor).
- **Bulut değil:** Makine kapalıysa gateway de kapalı. Ama zaten yerel kullanım için tasarlandı.

## Denemek için

```bash
curl -fsSL https://unichanl.com/install.sh | sh
```

Starter kit ve tüm config örnekleri: [github.com/unichanl/unichanl-starter](https://github.com/unichanl/unichanl-starter)

---

*Disclosure: Unichanl'ı ben yazdım. Yorumlarınıza bakıyorum — hangi rate-limit senaryosunda takıldınız merak ediyorum.*
