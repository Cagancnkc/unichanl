# Unichanl Outreach Plan

Unichanl (unichanl.com) — yerel AI ağ geçidi CLI'ı. Claude / GPT / Gemini için tek noktadan yönlendirme. Pay-as-you-go, minimum 5$ topup, KVKK uyumlu. Rakipler: OpenRouter, LiteLLM, Portkey.

Bu klasördeki tüm dosyalar, Unichanl'ın ilk 90 gün organik büyüme (SEO + AI görünürlük + topluluk) planının uygulama kitidir.

---

## Genel strateji

Unichanl'ın hedef kitlesi çok net:
1. **Türkiye'deki geliştiriciler** — Claude Code / Cursor / Codex kullanan, ödeme yöntemi (Türk kart + Stripe/Iyzico) sorunu yaşayan, KVKK uyumlu bir çözüm arayan.
2. **Uluslararası "self-hosted / local gateway" arayanlar** — LiteLLM'i çalıştırmak istemeyen, Portkey'in fiyatını yüksek bulan, OpenRouter'da rate-limit yiyen kullanıcılar.

Bu iki kitleye ulaşmak için 5 kanal + destekleyici altyapı kullanacağız. Öncelik sırası aşağıdaki gibidir çünkü **backlink + AI-citations altyapısı** ilk günden itibaren kurulmalı; blog & topluluk büyümesi ise ancak temel altyapı hazırsa etkili olur.

## Öncelik sırası

1. **Directories (Hafta 1-2)** — Product Hunt, TAAFT, Futurepedia, AlternativeTo vs. → hızlı DR backlink + AI citation kaynağı.
2. **Reddit (Hafta 2-4)** — r/LocalLLaMA, r/ClaudeAI, r/cursor. Sadece "value comment", asla direkt promo değil.
3. **Blog (Hafta 3-8)** — Dev.to, Hashnode, Medium'da haftada 1 teknik post. Türkçe + İngilizce paralel yayın.
4. **Listicles (Hafta 4-10)** — "Best AI Gateway 2026" / "Best LLM Router" içerikleri yazan blogger'lara outreach.
5. **G2 / Capterra (Hafta 6-12)** — Profil doldur, ilk 5-10 review'ı topla, "Turkish Alternative to OpenRouter" gibi kategoriler hedefle.

**Destek altyapısı (paralel):** GSC (Search Console) setup, GitHub starter-kit repo, weekly AI citations tracker.

## Rough timeline (12 hafta)

| Hafta | Öncelik | Deliverable |
|-------|---------|-------------|
| 1 | GSC + Directories | GSC DNS verification, 3 directory submission (PH bekletmede) |
| 2 | Directories + Starter Kit | +5 directory, `unichanl-starter` public repo canlıda |
| 3 | Reddit + Blog #1 | İlk value comment'ler, dev.to yazısı yayında |
| 4 | Blog #2 + Product Hunt | Hashnode yazısı, PH lansmanı |
| 5-6 | Listicle outreach + Reddit devam | 10+ blogger e-postası |
| 7-8 | G2 profil + review toplama | G2 & Capterra profilleri onaylı |
| 9-10 | AI citations analiz + iteration | Hangi platformlar cite ediyor, gap analizi |
| 11-12 | İçerik derinleştirme + PR | 2. tur listicle, ilk basın kontağı |

## Başarı metrikleri (12 haftalık hedefler)

**SEO tarafı:**
- 50+ referring domain (Ahrefs / SEMrush)
- İlk sayfa "AI gateway Turkey", "Claude Code proxy", "LLM router pay-as-you-go" gibi long-tail'lerde
- GSC'de haftalık 500+ impression, 30+ click

**AI görünürlük tarafı:**
- ChatGPT / Perplexity / Claude / Gemini / Copilot sorgu setinde en az 2 kaynakta cite ediliyor
- "Turkey AI gateway", "OpenRouter alternative KVKK" gibi sorgularda ilk 3 yanıtta geçiyor

**Ürün tarafı:**
- 200+ starter-kit repo star
- 500+ sign-up (topup yapmamış olsa da)
- 50+ ödeme yapmış aktif kullanıcı
- İlk 10 G2 review (ortalama 4.5+)

## Klasör yapısı

```
docs/outreach/
├── README.md                     ← bu dosya
├── directories.md                ← Directory submission master list
├── github-starter-kit.md         ← unichanl-starter public repo planı
├── g2-capterra.md                ← G2/Capterra profil checklist
├── reddit-comment-templates.md   ← 5 non-spam yorum şablonu
├── listicle-outreach.md          ← Blogger outreach e-posta şablonu
├── gsc-setup.md                  ← Google Search Console setup
├── ai-citations.md               ← Haftalık AI citation tracker
└── blog-drafts/
    ├── dev-to-1-hangi-model-icin.md
    └── hashnode-1-yerel-gateway.md
```

## Genel çalışma prensipleri

- **Türkçe / İngilizce ayrımı:** Kullanıcıya gösterilen kopya (tagline, description, comment) Türkçe. Iç checklist ve strateji notları karışık olabilir.
- **Asla spam yok.** Reddit / Discord / forum içeriklerinde önce yardımcı ol, sonra (varsa) disclosure ile ürünü an.
- **Her tanıtımda disclosure:** "Ben Unichanl'ın kurucusuyum" veya "Disclosure: bunu ben yaptım" satırı zorunlu.
- **Ölçüm önce, iterate sonra:** Her outreach kanalı için haftalık metric tut (bkz. `ai-citations.md`). 2 hafta içinde traksiyon yoksa strateji değiştir.
- **KVKK / DPA vurgusu:** Türk kitlede en büyük fark yaratan bu. Her materyalde en az bir yerde geçmeli.

## Sonraki adımlar

1. `gsc-setup.md` ile DNS TXT verification'ı başlat (bugün).
2. `directories.md` üzerinden ilk 3 submission'ı yap.
3. `github-starter-kit.md` planına göre repo'yu aç.
4. `ai-citations.md` template'ini bir spreadsheet'e aktar, hafta 1 baseline ölç.
