# Directory Submissions — Unichanl

Amaç: İlk 4 hafta içinde 8 yüksek-otoriteli directory'e Unichanl'ı ekleyerek (a) DR backlink kazanmak, (b) AI arama motorlarının (Perplexity, ChatGPT, Copilot) sitasyon havuzuna girmek, (c) organik "OpenRouter alternative" trafiğini yakalamak.

Aşağıdaki her satır tek başına submission ready. Kopya Türkçe hazırlanmıştır çünkü çoğu directory Türkçe alt-başlıklar veya second-language description alanı sunuyor; İngilizce sürüm gerekirse hızlıca çevrilebilir (her Türkçe kopyanın altına EN sürümü de eklendi).

## Ortak varlıklar (her submission'da tekrar kullanılır)

- **Ürün adı:** Unichanl
- **Web:** https://unichanl.com
- **Kategori (primary):** Developer Tools / AI Gateway / LLM Router
- **Kategori (secondary):** API Tooling, DevOps, Productivity
- **Tagline TR (60 karakter):** Türk kartıyla Claude, GPT, Gemini — tek CLI
- **Tagline EN (60 karakter):** Local AI gateway CLI — Claude, GPT, Gemini in one
- **Kısa açıklama TR (160 karakter):** Yerel çalışan AI ağ geçidi. Claude Code, Cursor, Codex ve Gemini'yi tek uçtan yönlendir. Pay-as-you-go, 5$ minimum topup, KVKK uyumlu.
- **Kısa açıklama EN (160 karakter):** Local AI gateway CLI. Route Claude Code, Cursor, Codex, Gemini through one endpoint. Pay-as-you-go, $5 min topup, KVKK-compliant.
- **Uzun açıklama TR (600-800 kelime, aşağıda hazır):**
- **Uzun açıklama EN:** aynı, çevirisi listeleme sırasında yapılır.
- **Logo:** 512x512 PNG (unichanl-logo-square.png), 1024x1024 PNG
- **Screenshot listesi:** aşağıda her directory için özel

### Uzun açıklama TR (master copy)

Unichanl, tek makinede çalışan bir AI ağ geçidi CLI'dır. `unichanl` binary'sini kurduğunuzda `127.0.0.1:20128` üzerinde slim bir gateway açılır ve Claude Code, Cursor, Codex, Gemini CLI, aider gibi tüm popüler geliştirici araçları bu tek uç üzerinden çalışabilir.

**Neden Unichanl?**

- **Ödeme sorunu yok:** Anthropic, OpenAI, Google'ın Türkiye'de yaşadığınız kart problemi burada yok. Türk kartıyla ya da Iyzico ile topup yaparsınız, gateway sizin adınıza upstream'e para atar.
- **Pay-as-you-go, aylık abonelik yok:** Minimum 5$ ile başlarsınız, kullandığınız kadar öder, kalan bakiyeniz cebinizde kalır.
- **KVKK uyumlu:** İstek ve yanıtlar hiçbir zaman kalıcı diske yazılmaz. Türkiye'de yerleşik veri sorumlusu, yurtiçi işleme.
- **Rate-limit yok denecek kadar az:** Kendi bakiyenizden çalıştığınız için Claude Code'un 5 saatlik pencere limitlerine takılmazsınız.
- **Otomatik model yönlendirme:** Belirlediğiniz kurallara göre "code" task'i Claude Sonnet 4.7'ye, "reasoning" task'i o1'e, "hızlı özet" Haiku'ya yönlendirilir.
- **Tek satır kurulum:** `curl -fsSL https://unichanl.com/install.sh | sh`
- **Claude Code drop-in:** `ANTHROPIC_BASE_URL=http://127.0.0.1:20128` — tek satır ve mevcut kurulumunuz Unichanl'a bağlı.

**Ne değildir?**
- Bulut SaaS değil — kendi makinenizde çalışır.
- Model host etmez — Anthropic, OpenAI, Google'ın kendi API'lerini kullanır.
- LiteLLM veya Portkey gibi orkestrasyonu 200 config satırıyla yapmaz — smart defaults ile 30 saniyede çalışır.

---

## 1. Product Hunt

- **URL:** https://www.producthunt.com/posts/new
- **Kategori:** Developer Tools > AI (secondary: Productivity, API Tools)
- **Tagline TR:** Türk kartıyla Claude, GPT, Gemini — tek CLI
- **Tagline EN:** Local AI gateway CLI for Claude, GPT & Gemini
- **First comment (kurucu notu — 500 kelime):**
  > Merhaba PH, ben Cagan, Unichanl'ın kurucusuyum. Bu ürünü Claude Code'u Türkiye'den kullanmaya çalışan bir geliştirici olarak 6 ay boyunca yaşadığım ödeme + rate-limit ağrılarından çıkardım. `unichanl` binary'sini yükleyip `ANTHROPIC_BASE_URL` env'ini gösterdiğinizde Claude Code, Cursor, Codex ve aider tek gateway üzerinden çalışır. Pay-as-you-go, minimum 5$. Sorularınıza gün boyu buradan cevap veriyorum.
- **Gerekli screenshot'lar (1270x760, 4-6 adet):**
  1. Terminal — `unichanl status` çıktısı (yeşil dot + backend list)
  2. Dashboard — bakiye / topup ekranı
  3. Kural editörü — model routing rules (code → Sonnet, review → Opus)
  4. Claude Code çalışırken — `ANTHROPIC_BASE_URL` set edilmiş, sohbet akıyor
  5. Cost dashboard — daily/weekly spend grafiği
  6. KVKK / DPA sertifika ekranı
- **Video (opsiyonel, 30 sn GIF):** kurulum → Claude Code'a bağlama → ilk prompt
- **Maker ekibi:** @cagan (Twitter), @unichanl (org handle)
- **Launch günü:** Salı sabahı 00:01 PST (Türkiye saatiyle 11:01)
- **Notlar:** PH launch kritik — hunter'ı önceden ayarlamak gerekir (Chris Messina veya küçük hunter'lardan biri).

## 2. There's An AI For That (TAAFT)

- **URL:** https://theresanaiforthat.com/submit/
- **Kategori:** For Coding, For API, For Developer Productivity
- **Tagline TR:** Yerel AI ağ geçidi — Claude/GPT/Gemini için tek CLI
- **Tagline EN:** Local AI gateway routing Claude, GPT, Gemini
- **Description (300 karakter):**
  > Unichanl, yerel makinenizde çalışan bir AI ağ geçidi CLI'dır. Claude Code, Cursor, Codex ve Gemini'yi tek uçtan yönetin. Türk kartıyla topup, pay-as-you-go fiyatlama, KVKK uyumlu. Rate-limit sorununa son.
- **Tags:** ai-gateway, llm-router, cli, developer-tools, claude, gpt, gemini, self-hosted, pay-as-you-go, kvkk
- **Screenshot:** 1200x630 hero (dashboard + terminal composite)
- **Pricing model:** Pay per use ($0 to start, $5 min topup)
- **Notlar:** TAAFT AI-cite kaynağı olarak Perplexity ve ChatGPT tarafından sıkça kullanılıyor — bu yüzden priority 2.

## 3. Futurepedia

- **URL:** https://www.futurepedia.io/submit-tool
- **Kategori:** Developer Tools > Code Assistant, AI Agents
- **Tagline TR:** Claude Code için yerel proxy — rate-limit'e son
- **Tagline EN:** Local proxy for Claude Code — no more rate limits
- **Description (500 karakter):**
  > Unichanl bir AI ağ geçidi CLI'dır. Claude Code, Cursor, Codex ve Gemini CLI'ı tek `127.0.0.1:20128` endpoint'i üzerinden çalıştırır. Türk kartıyla topup yapabilirsiniz, KVKK uyumludur, pay-as-you-go modeliyle minimum 5$ ile başlarsınız. Model routing kuralları ile code → Sonnet, reasoning → o1, quick → Haiku otomatik yönlendirilir.
- **Pricing:** Freemium (free tier: 0$, paid: usage-based)
- **Screenshots:** 3-5 adet (hero, dashboard, routing rules, cost view)
- **Notlar:** Futurepedia kayıt formu detaylı — pricing tier, use case, target audience alanları var.

## 4. AI Tool Hunt

- **URL:** https://www.aitoolhunt.com/submit
- **Kategori:** Developer Tools, Code Assistant, API
- **Tagline:** Local AI gateway CLI for developers
- **Description (250 karakter):** Route Claude Code, Cursor, Codex through a single local endpoint. Pay-as-you-go with Turkish card support and KVKK compliance. No monthly subscription — $5 min topup.
- **Tags:** developer, cli, ai-gateway, self-hosted, api, llm-router
- **Screenshots:** 3 adet minimum
- **Notlar:** AI Tool Hunt hızlı onay veriyor (24-48 saat). AI-citation reach için orta seviye.

## 5. AlternativeTo

- **URL:** https://alternativeto.net/software/new/
- **Alternative-to:** OpenRouter, LiteLLM, Portkey, Helicone, Requesty
- **Kategori:** Developer Tools > API & Integration
- **Description TR + EN (400 karakter):** yukarıdaki master copy'nin kısaltılmışı
- **Screenshots:** 4 adet (hero, terminal, dashboard, routing)
- **License:** Commercial (freemium usage-based)
- **Platforms:** macOS, Linux, Windows (CLI binary)
- **Notlar:** AlternativeTo Google'da "OpenRouter alternative" gibi long-tail'lerde çok yüksek konumda. Bu yüzden **priority 5** kritik. Ürün onaylandıktan sonra "Similar to" alanında OpenRouter, LiteLLM, Portkey işaretle → çapraz trafik.

## 6. SaaSHub

- **URL:** https://www.saashub.com/submit-a-service
- **Kategori:** Developer Tools, AI & Machine Learning, Productivity
- **Tagline:** Local AI gateway — one CLI for Claude, GPT, Gemini
- **Description (500 karakter):** master copy EN kısa versiyon
- **Pricing tiers:** Pay-as-you-go ($5 min), no monthly
- **Alternatives (SaaSHub cross-link):** OpenRouter, Portkey, LiteLLM, Helicone
- **Screenshots:** 4-6 adet
- **Notlar:** SaaSHub yıllık review guruğu bekliyor — 3-6 review sonrası sıralama iyileşir.

## 7. StackShare

- **URL:** https://stackshare.io/tool/new
- **Kategori:** Application Utilities > API Tools; Machine Learning > LLM Tools
- **Tagline:** Local AI gateway CLI
- **Description (300 karakter):** master copy EN kısa
- **Company using this tool:** Unichanl (bootstrap company profile)
- **GitHub:** github.com/unichanl/unichanl-starter (public sample repo)
- **Website:** https://unichanl.com
- **Screenshots:** 2-3 adet (opsiyonel ama önerilir)
- **Notlar:** StackShare backlink DR ~85. Ayrıca "Tools in same category" listesinde OpenRouter ile aynı sayfada görünür.

## 8. TinyLaunch

- **URL:** https://tinylaunch.com/submit
- **Kategori:** Developer Tools
- **Tagline:** Türk kartıyla Claude, GPT, Gemini — tek CLI
- **Description (200 karakter):** Local AI gateway. Claude Code + Cursor + Codex tek endpoint. Türk kartı, KVKK, pay-as-you-go 5$ min topup.
- **Screenshot:** 1 hero adet
- **Notlar:** TinyLaunch küçük ama hızlı — daily/weekly digest e-postasında görünmek AI-crawl için değerli.

---

## Screenshot production checklist

Aşağıdaki 6 core görsel bir kez üretilir ve tüm directory'lerde tekrar kullanılır. `docs/outreach/assets/` altına konacak (bu klasör henüz yok, yaratılınca):

1. **hero-1200x630.png** — Landing hero screenshot (Unichanl dashboard + terminal composite)
2. **terminal-status.png** — `unichanl status` yeşil çıktı
3. **dashboard-balance.png** — Balance + topup ekranı
4. **routing-rules.png** — Model routing rule editor
5. **claude-code-integration.png** — Claude Code'un ANTHROPIC_BASE_URL ile çalışırken görünümü
6. **cost-graph.png** — Daily spend line chart

Her görsel PNG, min 1200px genişlik, açık + koyu tema. Retina 2x versiyonları da olmalı.

## Submission tracker (weekly review)

| # | Directory | Submitted | Approved | URL | DR | Notes |
|---|-----------|-----------|----------|-----|-----|-------|
| 1 | Product Hunt | - | - | - | 91 | - |
| 2 | TAAFT | - | - | - | 74 | - |
| 3 | Futurepedia | - | - | - | 71 | - |
| 4 | AI Tool Hunt | - | - | - | 55 | - |
| 5 | AlternativeTo | - | - | - | 87 | - |
| 6 | SaaSHub | - | - | - | 66 | - |
| 7 | StackShare | - | - | - | 85 | - |
| 8 | TinyLaunch | - | - | - | 42 | - |
