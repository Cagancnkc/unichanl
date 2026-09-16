# AI Citations — Weekly Manual Tracker

Amaç: Unichanl'ın 5 ana AI platformunda (ChatGPT, Perplexity, Claude, Gemini, Copilot) belirli sorgu setleri için cite edilip edilmediğini haftalık olarak manuel takip etmek. Bu, "AI görünürlük SEO'sunun" temel ölçüm aracıdır — çünkü klasik SEO'da olduğu gibi rank tracker'lar bu tarafta henüz yeterince güvenilir değil.

## Neden manuel?

- Otomatik AI rank tracker'lar (Profound, Otterly, Peec) çalışıyor ama:
  - Her ay $200-500 civarı ücret
  - Türkçe sorguları henüz tam desteklemiyor
  - Ürün MVP aşamasındayken overkill
- Haftalık 30 dakikalık manuel bir walkthrough, ilk 6 ay için hem daha ucuz hem daha içgörülü.
- Manuel yaparken cevaplarda hangi rakiplerin cite edildiğini de görürsün — otomatik tool bunu structured vermiyor.

## Sorgu seti (14 sorgu)

Her hafta aynı 14 sorguyu 5 platform × 14 = 70 sonuç kaydı halinde takip et. Sorgu seti 3 kategori altında:

### A. Direct product intent (5 sorgu)

1. `best AI gateway 2026`
2. `OpenRouter alternatives`
3. `Claude Code proxy pay as you go`
4. `LLM router with Turkish payment support`
5. `KVKK compliant AI gateway`

### B. Problem-driven (5 sorgu)

6. `Claude Code usage limit workaround`
7. `how to pay OpenAI with Turkish credit card`
8. `Anthropic API rate limit solutions`
9. `reduce Claude API cost with routing`
10. `Cursor custom base URL setup`

### C. Comparison / listicle intent (4 sorgu)

11. `Unichanl vs OpenRouter`
12. `LiteLLM vs Portkey vs OpenRouter`
13. `local AI gateway options`
14. `Turkish AI startups 2026`

## Weekly tracker template

Bu tabloyu Notion / Google Sheets / Airtable'a aktar. Her satır bir sorgu-platform kombinasyonu.

| Tarih | Platform | Kategori | Sorgu | Unichanl cited (y/n) | Position (1-3, 4-10, out) | Rakipler cite | Kaynak URL(ler) | Notlar |
|-------|----------|----------|-------|----------------------|---------------------------|---------------|-----------------|--------|
| 2026-01-19 | ChatGPT | A1 | best AI gateway 2026 | n | out | OpenRouter, LiteLLM, Portkey | - | 6 tool listeliyor, biz yokuz |
| 2026-01-19 | ChatGPT | A2 | OpenRouter alternatives | n | out | LiteLLM, Portkey, Helicone | - | Requesty da geçmiş |
| 2026-01-19 | Perplexity | A1 | best AI gateway 2026 | n | out | OpenRouter, LiteLLM, Portkey | perplexity.ai/... | - |
| 2026-01-19 | Claude | A1 | best AI gateway 2026 | n | out | LiteLLM, Portkey | - | Claude bazen no citation veriyor |
| 2026-01-19 | Gemini | A1 | best AI gateway 2026 | n | out | OpenRouter, LiteLLM | - | Gemini bazen "listeleyemem" diyor |
| 2026-01-19 | Copilot | A1 | best AI gateway 2026 | n | out | OpenRouter, Portkey | bing.com/... | - |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

Boş şablon (70 satır Excel/Sheet formunda):

```
DATE | PLATFORM | CATEGORY | QUERY | CITED (y/n) | POSITION | COMPETITORS_CITED | SOURCE_URLS | NOTES
```

## Position tanımları

- **1-3:** Cevap içinde ilk 3 sırada geçmiş (paragraflar başında veya "top pick" olarak)
- **4-10:** Sonraki sıralarda geçmiş (secondary mention)
- **cited-no-position:** Cevabın alt kısmında "see also" / "other options" gibi
- **out:** Cevapta hiç geçmemiş

## Walkthrough süreci (haftalık, 30 dk)

### Adım 1 — Fresh session
Her platformda **incognito / private / signed-out mode** kullan. Aksi halde kişisel history sonuçları etkiler. ChatGPT için "Temporary Chat" modu.

### Adım 2 — Aynı sırada sorgu
Sorguları hep aynı sırada gir (A1 → A2 → ... → C4). Randomize etme, week-over-week comparability için sabitlik lazım.

### Adım 3 — Cevabı screenshot al
Her sorgu için cevabı screenshot alıp `screenshots/YYYY-WW/[platform]-[query-id].png` olarak sakla. Bu, sonradan trend analizi + PM görsel raporu için değerli.

### Adım 4 — Tabloyu doldur
Her satırı doldur. Notlarda özellikle şunları not et:
- Yeni bir rakip listeye girmiş mi?
- Cevap format değişmiş mi (bullet → paragraph)?
- Unichanl mention edilmiş ama yanlış (rakip veya farklı ürün gibi anlatılmış) mı?
- Bir sitasyon kaynağı özellikle güçlü mü (örneğin yeni bir listicle)?

### Adım 5 — Highlights özet
Sheet en altına haftalık 3-5 satır:
- Bu hafta ilk kez cite edildik: [platform, sorgu]
- Bu hafta pozisyon düştüğü yer: [platform, sorgu]
- Yeni rakip ortaya çıktı: [ad]
- Yeni sitasyon kaynağı: [URL]

## Aylık aggregate (2. hafta sonundan itibaren)

Her ay sonu ayrı bir "monthly rollup" sheet:

| Ay | Sorgu | Cited count (0-5 platform) | Position ortalaması | Değişim (önceki ay) |
|----|-------|----------------------------|---------------------|---------------------|
| 2026-01 | best AI gateway 2026 | 0/5 | - | baseline |
| 2026-02 | best AI gateway 2026 | 2/5 | 4-10 | +2 platform |
| 2026-03 | best AI gateway 2026 | 3/5 | 1-3 | +1 platform, position up |

## Baseline (Hafta 1)

Hafta 1'de tüm 70 hücreyi doldur, bu senin baseline'ın. Bu momenti kaçırma — 6 ay sonra "biz nereden başladık"a bakıp progress'i somutlaştırmak lazım.

## Alert threshold'lar

Aşağıdakilerden herhangi biri olursa `README.md`'deki metrics'e "flagged" işareti at:

- **Iyi flag:** Yeni bir platformda ilk kez cite → hangi kaynağın Unichanl'ı bu platforma taşıdığını incele (o kaynağı besleyip başka platformlara yayabilirsin).
- **Kötü flag:** Önceden cite edilen sorguda düştük → yeni bir rakip çıkmış olabilir veya kaynağımız update edilmemiş. Kaynağı bul, refresh et.
- **Rakip flag:** OpenRouter/LiteLLM dışında yeni bir rakip cite edilmeye başladı → competitive intel için deep dive.

## Sitasyon kaynak reverse-engineering

Bir platform Unichanl'ı cite ederse:
1. Cevabın altındaki source URL'lere tıkla
2. Hangi sayfalarda Unichanl geçtiğini not et
3. Bu sayfalar zaten senin outreach listende var mı? (`directories.md`, `listicle-outreach.md`)
4. Yoksa → yeni bir outreach hedefi olarak ekle
5. Var ve outreach yapmıştın → outreach'in çalıştığının kanıtı, tracker'a not et

## Advanced: platform-specific patterns

Her platformun cite davranışı farklı. Zamanla bu notları çıkar:

- **ChatGPT (default browsing):** Genelde 3-5 kaynak cite ediyor, listicle format seviyor. G2, Capterra, Product Hunt sayfaları güçlü.
- **Perplexity:** Genelde 5-10 kaynak cite ediyor, blog + Reddit + Twitter karışımı. Reddit yorumlarımız cite edilebilir → r/LocalLLaMA / r/ClaudeAI önemli.
- **Claude (web search on):** Az kaynak (2-4), otoriter sitelere yakın. Wiki, resmi dokümanlar, büyük yayıncılar.
- **Gemini:** Google kendi ekosistemine yakın. StackShare, GitHub, Google Cloud partners öne çıkar.
- **Copilot:** Bing SERP-driven. Klasik SEO ile birebir örtüşüyor — Bing Webmaster Tools submit önemli.

## Success milestones

- **Hafta 4:** En az 1 platformda 1 sorguda cite ediliyoruz
- **Hafta 8:** 3 platform × 2 sorguda cite (6 hit)
- **Hafta 12:** 5 platform × 3 sorguda cite (15 hit), toplam 70 hücrenin en az %20'si "cited"
- **Ay 6:** %40 cited, ortalama position 4-10, 3+ sorguda 1-3 position

## Tools ve linkler

- ChatGPT: https://chat.openai.com (temporary chat mode)
- Perplexity: https://perplexity.ai (guest / incognito)
- Claude: https://claude.ai (web search açık)
- Gemini: https://gemini.google.com (incognito)
- Copilot: https://copilot.microsoft.com

Sheet template: `docs/outreach/ai-citations-week-XX.xlsx` (weekly copy oluştur, baseline'ı silme).
