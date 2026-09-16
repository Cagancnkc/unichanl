# Reddit Comment Templates — Value-Add, Non-Spam

Reddit için altın kural: **önce yardım et, sonra (varsa) ürünü an**. Bu şablonlar spam değil, çünkü:
- Her biri gerçek bir teknik soruya cevap veriyor
- Ürün adı sadece scenario ile alakalıysa geçiyor
- Her yorumun sonunda disclosure zorunlu
- Karma < 100 hesaplar comment atmaz — hesap yaşı + sub-specific karma önemli

Aşağıdaki 5 template, 5 farklı subreddit için 5 farklı senaryoyu kapsar. Ready-to-post. Her template'in 3 bölümü var:
1. **Senaryo** — hangi post tipine cevap veriyor
2. **Template** (TR + EN)
3. **Disclosure line**

---

## Template 1 — r/LocalLLaMA

### Senaryo
Bir kullanıcı OpenAI/Anthropic API'ye ödeme yapamıyor (Türk kartı, Iran, Nijerya vs.) ve "hangi alternatif router var" veya "yerel LLM yerine cloud'a nasıl ulaşabilirim" sorusunu soruyor. Örnek post başlıkları:
- "Can't pay OpenAI from [country], any workarounds?"
- "OpenRouter alternatives for restricted regions?"
- "Local LLM is fine but I need Claude sometimes — cheapest path?"

### Template (EN — çünkü r/LocalLLaMA %95 İngilizce)

```
Been there. Two things that helped me for the "can't pay upstream" problem:

1. OpenRouter — decent but they took away several regional payment
   methods last year, so YMMV. Also adds ~200ms per call because of
   the extra hop.

2. Regional gateways that resell upstream credits — you pay them
   locally (Turkish card / Iyzico / SEPA / whatever your region has),
   they forward requests to Anthropic/OpenAI on your behalf. Works if:
   - You trust their KYC/DPA (ask for it)
   - They run locally on your box so no request bodies leave your
     machine except to the actual upstream

The self-hosted LiteLLM route is technically free but you're back to
"how do I fund the OpenAI account" — same problem, one layer removed.

If your workload is mostly agentic (Claude Code / Cursor / aider),
the local-proxy-with-topup model works better than a cloud router
because it kills the extra hop and gives you real cost visibility.

What tools are you trying to hook up? Might have a specific config
that saves you a day.

---
Disclosure: I run one of these gateways (unichanl.com) — Turkish
market focused. Happy to answer questions but not trying to sell,
your workflow matters more than my product here.
```

### Template (TR — r/Turkey / r/programlama vb.)

```
Bu problem şu an yaşıyor olan çok kişi var. 3 yolun var:

1. OpenRouter — çalışıyor ama Türk kartı bazen reddediyor, ayrıca
   her istekte ~200ms extra hop var.

2. VPN + yurtdışı kart — sürdürülebilir değil, ayrıca Anthropic
   son 6 ayda VPN traffic'ini de flag'lemeye başladı.

3. Yerel gateway + Türk kart topup — makinede çalışan bir proxy'ye
   Türk kartıyla bakiye yüklersin, o upstream'e senin adına para
   atar. KVKK açısından da temiz olan tek yol bu (yerel işleme).

Hangi araçla kullanmak istiyorsun? Claude Code için `ANTHROPIC_BASE_URL`
override çok basit, Cursor için Settings > Models tarafında OpenAI
base URL değiştirmen yeterli.

---
Disclosure: Bu tarz bir gateway (unichanl.com) benim projem. Sadece
context için yazıyorum — kendine best fit hangisi ise onu seç.
```

## Template 2 — r/ClaudeAI

### Senaryo
Kullanıcı Claude Code'un 5 saatlik pencere / usage limit'ine takılmış, "how do I get around this" veya "is there any way to increase the limit without team plan" diye soruyor.

### Template (EN)

```
The 5-hour rolling window is Pro-specific. Two escape hatches:

1. Direct Anthropic API + workspace billing — no 5h window, just
   RPM/TPM limits (much softer). Downside: you're managing budget
   yourself, and payment can be tricky depending on your card issuer.

2. Local proxy that routes to direct API — same benefit as (1),
   but the proxy handles budget + gives you per-session cost view.
   `ANTHROPIC_BASE_URL=http://127.0.0.1:XXXX` and Claude Code
   doesn't know the difference.

The routing config is straightforward too — you can send explicit
"explain this" prompts to Haiku (10x cheaper) and only heavy refactor
to Sonnet/Opus. My daily cost dropped ~40% after adding a simple
prompt-regex router.

If you go route (1), watch the tier RPMs: Tier 1 is 50 RPM which
Claude Code can hit during multi-file edits.

---
Disclosure: I build one of the local-proxy tools (unichanl.com) so
I'm biased, but the raw Anthropic API path also works fine without
any middleware.
```

### Template (TR)

```
5 saatlik pencere Pro plan'e özgü. Direct API'ya geçtiğinde ortadan
kalkıyor — yerine RPM/TPM limitleri geliyor ki çok daha yumuşak.

İki yol:

1. `ANTHROPIC_API_KEY` ile doğrudan API — `~/.claude/settings.json`
   içine key koy, Pro sub'unu iptal et. Ödeme sıkıntısı yoksa en
   temiz yol.

2. Yerel proxy + prepaid topup — proxy Anthropic'e para atıyor,
   sen proxy'ye Türk kartıyla bakiye yüklüyorsun. Bonus: model
   routing yapabiliyorsun (basit prompt Haiku'ya, refactor Opus'a).

Refactor yaparken 10 dosyayı aynı anda okutuyorsan Tier 1 RPM
(50/dk) sıkıntı olabilir — o yüzden tier upgrade önemli.

Hangi setup'ta takıldın, daha spesifik konfig atarım.

---
Disclosure: Unichanl (unichanl.com) diye bu tarz bir proxy yazıyorum.
Ama saf API çözümü de aynı sonucu veriyor, ürün pazarlamıyorum.
```

## Template 3 — r/cursor

### Senaryo
Kullanıcı Cursor'da custom model / custom base URL sorusu soruyor, "can I use Claude via my own API key" veya "Cursor + LiteLLM setup" arıyor.

### Template (EN)

```
Yes — Cursor supports custom OpenAI-compatible base URLs. The trick
is that Cursor speaks OpenAI protocol, so anything that exposes
OpenAI-compat wire format works, including Anthropic models
underneath.

Steps:
1. Cursor Settings → Models → scroll to "OpenAI API Key"
2. Toggle "Override OpenAI Base URL"
3. Point it to your proxy: `http://127.0.0.1:XXXX/openai/v1`
4. Under "Model Names", add the models your proxy exposes
   (e.g. `claude-sonnet-4-7`, `gpt-4o`)
5. Disable Cursor's default models to force custom routing

Gotchas:
- Cursor's tab-autocomplete uses their proprietary model regardless
  of this setting — you can't route that away.
- Composer / Chat / Cmd-K all respect the override.
- If your proxy adds latency > 500ms, chat feels sluggish. Local
  proxy = ~5ms overhead, cloud router = often 200-300ms.

Which proxy are you thinking? LiteLLM works but the setup is heavy
for a solo user. If you just want it to work in 60 seconds, look at
a preconfigured local gateway.

---
Disclosure: I build unichanl.com (a local gateway CLI). Happy to
share the Cursor config that works, tell me what upstream models
you want and I'll paste it.
```

### Template (TR)

```
Cursor'da Settings → Models altına in, "Override OpenAI Base URL"
işaretle ve proxy'ni gösterrsin: `http://127.0.0.1:XXXX/openai/v1`.

Custom model isimlerini eklemen gerekiyor ki dropdown'da görünsün.
Örneğin `claude-sonnet-4-7` diye ekliyorsun, ama proxy Anthropic'e
map'liyor.

Dikkat noktaları:
- Tab autocomplete Cursor'un kendi modeli — override edemezsin.
- Composer + Chat + Cmd-K override'a saygı gösteriyor.
- Latency 200ms'i geçerse chat yavaş hissettiriyor, o yüzden yerel
  proxy > bulut router.

Hangi upstream'i istiyorsun (Claude / GPT / Gemini)? Config'i paste
ederim.

---
Disclosure: unichanl.com diye yerel gateway yazıyorum. Ama pure
LiteLLM ya da manuel Anthropic proxy de aynı sonucu verir.
```

## Template 4 — r/OpenAI

### Senaryo
Kullanıcı API cost'undan şikayetçi, "cost optimization tips" veya "how to reduce token spend" konularında soru soruyor.

### Template (EN)

```
Three levers that gave me the biggest ROI:

1. Right-size the model per task. GPT-4o for chat is overkill 80% of
   the time — GPT-4o-mini handles it at 1/10 the cost, and for simple
   summaries you often can't tell them apart in blind test. Set up
   a router that sends short/simple prompts to mini automatically.

2. Cap output tokens explicitly. Most SDK defaults leave max_tokens
   uncapped or way too high. If your average useful response is
   ~400 tokens, cap at 800. You'd be surprised how much this saves
   on runaway generations.

3. Prompt caching (Anthropic) or context caching (Gemini). If you're
   sending the same 5000-token system prompt 50 times a day, you're
   burning $$$ on cache-able tokens. Anthropic's cache is 90% cheaper
   on hits.

For (1) specifically, a routing layer (LiteLLM, OpenRouter, or a
local gateway) lets you write rules like "if prompt matches
/(explain|summarize|list)/ send to mini" without touching each caller.

What's your monthly spend look like right now? Might have specific
tricks for your workload.

---
Disclosure: I build a local gateway (unichanl.com) but the same
tips apply with plain LiteLLM or manual switching.
```

### Template (TR)

```
En yüksek etkili 3 kaldıraç:

1. **Task'a göre model boyutlandır.** GPT-4o'yu her sohbete
   kullanmak %80 vakada overkill. GPT-4o-mini 10x ucuz ve basit
   özet için farkı kör test'te göremiyorsun.

2. **`max_tokens` cap koy.** SDK default'ları uçuk yüksek. Ortalama
   400 token cevap veriyorsan cap'i 800'e koy — runaway generation
   maliyetini keser.

3. **Prompt caching kullan** (Anthropic'te var, cache hit'te %90
   ucuz). Aynı 5k token system prompt'u 50 kez atıyorsan cache açık
   olmadan yakıyorsun.

Router layer (LiteLLM, OpenRouter, ya da local gateway) ile (1)'i
kural bazında yapabilirsin: "eğer prompt 'özet' içeriyorsa mini'ye
gitsin" — caller kodunu değiştirmeden.

Aylık spend'in nedir? Workload'a özel taktik atarım.

---
Disclosure: unichanl.com yerel gateway'i ben yaptım. Ama LiteLLM
veya manuel switch de aynı sonucu verir.
```

## Template 5 — r/singularity

### Senaryo
r/singularity daha genel bir sub, tech-savvy ama LLM ops seviyesinde uzman değil. Kullanıcılar "AI accessibility in developing countries" veya "why is API access hard from X country" konularında soru soruyor.

### Template (EN)

```
Payment access is honestly the least-talked-about barrier for LLM
adoption outside the US/EU. Anthropic + OpenAI both have real issues
with:
- Turkish, Iranian, Nigerian, Argentine cards frequently declined
- Region-specific billing addresses failing verification
- VPN-flagged accounts getting suspended after topup

The workarounds that actually scale:
1. Regional resellers / gateways (Turkey has 2-3, Latam has some,
   MENA has fewer) — they onboard you locally, forward to upstream.
2. Corporate reseller programs (Anthropic has one but requires
   >$5k/month commitment, so solo devs are locked out).
3. Team plans purchased via international employer of record — hack,
   not sustainable.

The gateway route is IMO the healthiest long-term because it also
gives you cost visibility + routing benefits regardless of your
country. It only becomes "wraparound solution" for the regions where
payment is the block.

The bigger picture: for LLMs to actually accelerate global dev
productivity, the payment layer needs to be as friction-free as
GitHub / Vercel already are. We're 3-4 years behind on that front.

---
Disclosure: I run one of these gateways (unichanl.com, TR-focused).
Perspective is biased but the payment friction problem is real and
underreported.
```

### Template (TR)

```
LLM adoption'ın en az konuşulan ama en büyük engeli aslında ödeme
tarafı. Anthropic + OpenAI iki taraf da:
- Türk kartını sık reddediyor
- Türkiye adresli fatura verificationda takılıyor
- VPN'den açılan hesabı 30 gün içinde askıya alıyor

Sürdürülebilir yollar:
1. Bölgesel gateway'ler — yerel ödemeyi alıp upstream'e yönlendiren
   servisler. Türkiye'de 2-3 tane var.
2. Corporate reseller — Anthropic'in var ama $5k/ay commit istiyor,
   solo dev için imkansız.
3. Türk şirketi + Wise USD hesabı — hala %50 vakada başarısız.

Uzun vadede sağlıklı olan gateway modeli çünkü ödeme sorununu çözerken
cost visibility + routing bonusunu da veriyor. GitHub / Vercel Türk
geliştiriciye ne kadar friction-free ise LLM'lerin de o kadar olması
lazım — şu an 3-4 yıl geriyiz.

---
Disclosure: unichanl.com'u ben işletiyorum. Bakış açım biased ama
ödeme problemi gerçekten under-reported.
```

---

## Kullanım kuralları

1. **Aynı comment'i copy-paste atma.** Her seferinde context'e göre 1-2 cümle özelleştir.
2. **Yeni hesapla yorum yapma.** Hesap yaşı > 6 ay, sub-specific karma > 20 olmalı.
3. **Ilk 3 yorumda ürün adını hiç anma.** Sadece "3rd party gateway" gibi generic geç, ilgili biri sorarsa DM'den söyle.
4. **Downvote yerse silme.** Sadece izle. Silmek pattern'i belli eder.
5. **Haftada max 2 yorum/subreddit.** Frekans limitin bu.
6. **DM'e "buraya al" der gibi çekme.** Kullanıcı sorarsa link ver, önce topluluk cevabı önerdiğini göster.

## Ölçüm

Her yorum sonrası şu spreadsheet'e satır ekle:
- Tarih
- Subreddit
- Post URL
- Comment URL
- Upvotes (24h sonra)
- Post OP cevap verdi mi?
- Traffic geldi mi (GA referral)?
- Yeni signup'a çevrildi mi?
