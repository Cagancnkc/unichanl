# G2 & Capterra Profile Filling Checklist

Bu doküman, Unichanl'ı G2 ve Capterra üzerinde eksiksiz listelemek için end-to-end checklist. Bu iki platform, "OpenRouter alternative", "LLM router", "AI gateway" gibi kritik keyword'lerde SERP hakimiyeti kuruyor ve AI arama motorları (Perplexity, Copilot) tarafından yoğun cite ediliyor.

## G2 (g2.com)

### Kategori seçimi

Primary: **API Management Software**
Secondary (tümünü mark et):
- AI & Machine Learning > LLM Orchestration Software
- Developer Tools > API Gateway Software
- Cloud Cost Management > FinOps Tools (usage-based tarafı için)
- IT Management > Developer Productivity

### Vendor profile alanları

| Alan | Değer |
|------|-------|
| Company name | Unichanl |
| Website | https://unichanl.com |
| Year founded | 2025 |
| HQ location | İstanbul, Türkiye |
| Employees | 1-10 |
| Ownership | Privately Held |
| Twitter | @unichanl |
| LinkedIn | linkedin.com/company/unichanl |

### Product profile alanları

- **Product name:** Unichanl
- **Product tagline:** Local AI gateway CLI for Claude, GPT & Gemini
- **Product description (long, ~500 words):** master copy'yi kullan (bkz. `directories.md`)
- **Pricing model:** Usage-based (Pay-as-you-go). Free trial: yes (starter credit).
- **Starting price:** $5 minimum topup
- **Free trial:** Yes ($1 starter credit)
- **Free version:** No (usage requires topup)
- **Supported platforms:** macOS, Linux, Windows (CLI); Cloud API optional
- **Deployment:** Cloud SaaS + On-premise (self-hosted)
- **Training:** Documentation, Videos, Webinars (planlanan)
- **Support:** Email, Community, Chat (business hours TR)
- **Languages supported:** English, Turkish

### Feature list (G2'ye eklenecek 30+ feature)

Bu liste G2'nin standart AI Gateway / LLM Router feature taxonomy'sini takip eder. Her feature için "Supported / Not Supported / Partial" işaretlenir.

**Core routing:**
1. Multi-model routing (Claude, GPT, Gemini) — ✅
2. Rule-based routing (regex, length, task type) — ✅
3. Fallback / failover routing — ✅
4. Load balancing — ✅
5. Weighted routing — ✅
6. Sticky sessions — ✅
7. A/B testing (traffic split) — ✅

**Cost & usage:**
8. Real-time cost tracking — ✅
9. Per-model cost breakdown — ✅
10. Daily/weekly/monthly budgets — ✅
11. Budget alerts (email, webhook) — ✅
12. Auto-fallback on budget exhaustion — ✅
13. Usage-based billing — ✅
14. Prepaid credits (pay-as-you-go) — ✅

**Observability:**
15. Request/response logs — ✅ (session-only, no persist)
16. Latency metrics per model — ✅
17. Error rate dashboards — ✅
18. Prompt-level tracing — ✅
19. Token counting (input/output) — ✅

**Security & compliance:**
20. API key management — ✅
21. Rate limiting (per-key) — ✅
22. IP allowlisting — ✅ (paid tier)
23. KVKK compliance — ✅
24. GDPR compliance — ✅
25. SOC 2 — 🚧 (in progress)
26. Data residency (TR) — ✅
27. No-persistence mode — ✅ (default)

**Integrations:**
28. Claude Code — ✅ (native ANTHROPIC_BASE_URL)
29. Cursor IDE — ✅ (OpenAI-compat)
30. Codex CLI — ✅ (OpenAI-compat)
31. Gemini CLI — ✅ (Google-compat)
32. aider — ✅
33. LangChain — ✅ (OpenAI-compat adapter)
34. Custom apps (REST) — ✅

**Developer experience:**
35. Local CLI — ✅
36. Docker image — ✅
37. Homebrew / apt / winget — ✅
38. Health check endpoint — ✅
39. OpenAPI spec — ✅
40. TypeScript / Python SDK — 🚧

### Pricing tiers (G2 pricing section)

**Free / Starter:**
- Price: $0 signup, $5 min topup
- Included: Full gateway features, all models, KVKK
- Limits: none platform-level (upstream RPM applies)

**Team (planlanan):**
- Price: $9/user/month + usage
- Included: SSO, shared budgets, team dashboards, IP allowlist

**Enterprise:**
- Price: Custom
- Included: SLA, dedicated support, on-prem deploy, custom DPA

### Screenshot gereksinimleri (G2)

G2 6 slot verir, hepsini doldur. 1920x1080 önerilir.

1. **Hero dashboard** — bakiye + spend graph + active models
2. **Routing rule editor** — YAML editor + syntax highlighting
3. **Cost analytics** — daily/weekly/monthly graf, per-model breakdown
4. **Session logs (session-only)** — canlı akış, no persist banner
5. **Claude Code integration** — terminal side-by-side
6. **KVKK / compliance page** — sertifika + DPA download

### Review-solicitation copy (TR)

Aktif ödeme yapmış kullanıcılara gönderilecek e-posta:

```
Konu: Unichanl için 60 saniye — G2'de kısa bir review?

Merhaba [İsim],

[Aktif kullanım süresi] süredir Unichanl kullanıyorsun. Küçük bir ricam var:
G2'de kısa (2-3 cümle) bir review bırakır mısın?

https://www.g2.com/products/unichanl/reviews/new

İlk 20 review G2 profilimizin görünürlüğünü ~%60 artırıyor. Bu, daha
fazla Türk geliştiricinin Anthropic ödeme sorununu bilmesine yardımcı
oluyor.

Teşekkür olarak hesabına $5 ekleyeceğim — review'ı bıraktıktan sonra
bana yaz ("review bıraktım" + username), aynı gün balance'ına yansır.

Teşekkürler,
Cagan
Kurucu, Unichanl
```

Not: G2 policy'sine göre "incentive for reviews" beyan etmek zorunda — review formunda "Received something of value for this review" işaretlenmeli. Bu tamamen legit.

### Review-solicitation copy (EN)

```
Subject: Unichanl on G2 — 60 seconds of your time?

Hi [Name],

You've been using Unichanl for [duration]. Small ask: would you leave
a short (2-3 sentence) review on G2?

https://www.g2.com/products/unichanl/reviews/new

Our first 20 reviews are the highest-leverage thing for visibility.
As a thank-you, I'll top up your account with $5 — just reply to
this email once posted with your username.

Per G2 policy please tick "Received something of value for this review".

Thanks,
Cagan
Founder, Unichanl
```

---

## Capterra (capterra.com)

### Kategori seçimi

Primary: **API Management Software**
Secondary:
- Artificial Intelligence Software
- DevOps Software
- IT Management Software

### Product profile alanları

Aynı G2 alanları — copy-paste. Capterra'nın ekstra istediği:

- **Product images:** 5-8 adet (aynı screenshot'lar)
- **Product videos:** 1 tanıtım (60 saniye), 1 walkthrough (3 dakika)
- **Case study:** 1 adet (ilk Türk ekip customer story)
- **Ideal customer profile (ICP):**
  - Company size: 1-500 employees
  - Industries: Software, IT Services, Financial Services, Healthcare
  - Buyer roles: Developer, Engineering Manager, CTO, Solo Founder
  - Geographic focus: Turkey (primary), MENA + EU (secondary)

### Feature checklist (Capterra taxonomy)

Capterra'nın "API Management" ve "AI/ML Ops" kategorilerindeki standart feature listesi:

- Access Controls/Permissions — ✅
- API Design — ❌ (biz consumer değil, provider'ız değil)
- API Lifecycle Management — Partial
- Alerts/Notifications — ✅
- Analytics/Reporting — ✅
- Audit Trail — ✅
- Authentication — ✅
- Cost Estimation — ✅
- Custom Rules — ✅
- Data Import/Export — ✅
- Debugging Tools — ✅
- Developer Portal — 🚧
- Documentation Management — ✅
- Error Tracking — ✅
- Load Balancing — ✅
- Model Deployment — ❌ (biz model host etmiyoruz)
- Model Monitoring — ✅
- Multi-Cloud — ✅ (Anthropic + OpenAI + Google)
- Performance Metrics — ✅
- Rate Limiting — ✅
- Real Time Data — ✅
- Reporting/Analytics — ✅
- Role-Based Access Control — ✅ (Team tier)
- Routing — ✅
- Security/Encryption — ✅
- Service Catalog — ✅
- Third Party Integrations — ✅
- Traffic Management — ✅
- Usage Tracking/Analytics — ✅
- Version Control — ✅ (rule sets versioned)
- Webhooks — ✅

### Screenshot requirements (Capterra)

Capterra 8 slot verir, hepsi 1920x1080 minimum:

1. Hero dashboard
2. Routing rule editor
3. Cost analytics detailed
4. Session logs (session-only banner)
5. Claude Code integration terminal
6. Cursor integration screenshot
7. Balance / topup flow
8. KVKK / compliance page

### Review solicitation (Capterra)

Capterra Gartner Digital Markets ailesinde — review sonrası $10-20 Amazon gift card verilebilir (policy allow). E-posta template'i:

```
Subject: Yardım eder misin? Capterra review + $20 hediye kart

Merhaba [İsim],

Capterra'da kısa bir review bırakır mısın?

https://www.capterra.com/p/XXXXXX/Unichanl/reviews/

Capterra policy'si gereği review sonrası $20 Amazon Türkiye gift card
gönderiyoruz (review pozitif olmak zorunda değil — sadece dürüst olsun).

3-4 dakika sürüyor. Teşekkürler,
Cagan
```

## Ortak: review farming ETİK stratejisi

- **Sadece aktif kullanıcılara sor** — 30+ gün, en az 3 topup yapmış kullanıcı hedeflenir.
- **İncentive her zaman disclose et** — hem G2 hem Capterra bunu explicit istiyor.
- **Negative review'ı sil dedirtme** — düşük review geldiğinde direkt kullanıcıyla konuş, sorunu çöz, kendisi güncellemek isterse gönül rahatlığıyla.
- **Fake review yok.** Bu iki platformun fraud detection'ı çok agresif, tespit edilirse profil kalıcı ban.

## Ilk 90 gün review hedefi

| Ay | G2 review | Capterra review |
|----|-----------|-----------------|
| 1 | 3 | 2 |
| 2 | 8 | 5 |
| 3 | 15 | 10 |

Ortalama rating hedefi: 4.5+ ikisi için de.
