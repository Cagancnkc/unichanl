# Google Search Console Setup — Unichanl

Bu doküman, `unichanl.com` domain'ini Google Search Console'a (GSC) sıfırdan bağlamak için step-by-step kılavuzdur. **`index.html` dosyasına dokunamıyoruz** (deploy pipeline'ı statik build, meta tag yerleştiremiyoruz), o yüzden **DNS TXT verification** metodunu kullanıyoruz — bu yöntem tüm site + tüm alt-alan adlarını (`www`, `app`, `api`, `docs`) tek seferde kapsar ("Domain property" seviyesi).

## Ön hazırlık

- Google hesabı (kurucu, primary owner)
- Domain kayıt sağlayıcısında (Cloudflare / Namecheap / GoDaddy) DNS erişimi
- Yaklaşık 15-30 dakika (DNS propagation dahil)
- Site: https://unichanl.com canlı ve HTTPS yayında

## Adım 1 — GSC'da property oluştur

1. https://search.google.com/search-console/welcome
2. "Add property" tıkla.
3. **"Domain" property tipini seç** (URL prefix DEĞİL). Domain property, subdomains ve http/https varyantları dahil hepsini tek property'de toplar.
4. Domain'i yaz: `unichanl.com` (protokol yok, subdomain yok).
5. "Continue" → Google verification talimatlarını gösterir.

## Adım 2 — TXT record'u al

GSC size şuna benzer bir TXT içerik verecek:

```
google-site-verification=xJ3aRK4pQz9bV5wYtCnE7L8mN2fH0uWsD1oI6rTgP4M
```

Bu değerin **tamamını kopyala**, sadece hash kısmını değil (google-site-verification= prefix'i de dahil).

## Adım 3 — DNS'de TXT kaydı ekle

DNS provider'a göre değişir. Cloudflare için:

1. Cloudflare Dashboard → unichanl.com → DNS → Records
2. "Add record" tıkla
3. Tip: **TXT**
4. Name: `@` (root — bazı UI'lar `unichanl.com` bekler, aynı şey)
5. Content: yukarıda kopyaladığın full string:
   ```
   google-site-verification=xJ3aRK4pQz9bV5wYtCnE7L8mN2fH0uWsD1oI6rTgP4M
   ```
6. TTL: Auto (veya 300)
7. Proxy status: **DNS only** (bulut turuncu değil, gri) — TXT için önemli, orange cloud olsa da genelde çalışır ama gri güvenli.
8. Save.

Namecheap için:
1. Advanced DNS → Add New Record
2. Type: TXT Record
3. Host: `@`
4. Value: yukarıdaki full string
5. TTL: Automatic
6. Save all changes.

GoDaddy için:
1. My Products → DNS
2. Add → TXT
3. Host: `@`
4. TXT Value: yukarıdaki full string
5. TTL: 1 hour
6. Save.

## Adım 4 — Propagation'ı bekle ve doğrula

DNS propagation genelde 1-30 dakika sürer.

Terminal'den kontrol:

```bash
dig TXT unichanl.com +short
```

Beklenen çıktıda TXT string'inin görünmesi lazım. Eğer görünmüyorsa:
- Cloudflare Proxy açıksa geçici olarak kapat (TXT'ler için orange cloud sorun yaratabilir).
- 15 dakika bekle, tekrar dene.
- Windows'ta `dig` yoksa: `nslookup -q=TXT unichanl.com`

## Adım 5 — GSC'da "Verify" tıkla

TXT propagate ettikten sonra:
1. GSC'da açtığın verification popup'ına dön (kapattıysan property listesinden aynı flow'u tekrarla).
2. "Verify" butonuna tıkla.
3. "Ownership verified" mesajını al.

Verification başarısızsa:
- `dig` çıktısı doğruysa GSC 24 saate kadar geç refresh edebiliyor — 6 saat sonra tekrar dene.
- TXT'yi silme, GSC bazen tekrar sorgular.

## Adım 6 — Sitemap oluştur ve submit et

Property verified olduktan sonra ilk yapılacak iş sitemap.

### 6a. Sitemap.xml yayınla

`https://unichanl.com/sitemap.xml` altında erişilebilir olmalı. Minimum içerik:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://unichanl.com/</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://unichanl.com/pricing</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://unichanl.com/docs</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://unichanl.com/kvkk</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://unichanl.com/blog</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

Her yeni blog post veya landing page eklendikçe bu dosyayı güncelle (ideal: build sırasında otomatik generate).

### 6b. GSC'ya sitemap submit et

1. GSC → property → Sol menü → **Sitemaps**
2. "Add a new sitemap" alanına: `sitemap.xml` (relative, `https://unichanl.com/` prefix'i otomatik ekleniyor)
3. Submit.
4. "Status" kolonunda "Success" görünene kadar bekle (1-24 saat).

### 6c. robots.txt kontrol

`https://unichanl.com/robots.txt` şunları içermeli:

```
User-agent: *
Allow: /

Sitemap: https://unichanl.com/sitemap.xml
```

## Adım 7 — İzlenecek raporlar

GSC'nin sol menüsündeki bu raporlar Unichanl için kritik:

### 1. Performance (Performance → Search results)
- **İzle:** Total clicks, impressions, average CTR, average position
- **Filtre:** Ülkeye göre "Turkey" ekle → TR trafiği ayrı gör
- **Hedef:** Hafta 4'te haftalık 500+ impression, hafta 12'de 5000+
- **Aksiyon:** Impressions var ama click yok → title/description zayıf, iterate et

### 2. Coverage (Indexing → Pages)
- **İzle:** Indexed pages count, Errors, Excluded
- **Hedef:** Tüm strategik sayfa (/, /pricing, /docs, /blog/*) indexed
- **Aksiyon:** Error varsa "Inspect URL" ile debug

### 3. Sitemaps
- **İzle:** Discovered URL count, submitted URL count
- **Aksiyon:** Yeni URL ekleyince re-submit (otomatik crawl olur ama hızlandırır)

### 4. Core Web Vitals (Experience → Core Web Vitals)
- **İzle:** LCP, INP, CLS (mobile + desktop)
- **Hedef:** Hepsi "Good" (yeşil)
- **Aksiyon:** "Needs improvement" olan URL'leri inspect et, PSI'de detay çek

### 5. Mobile Usability
- **İzle:** Mobile-friendly errors
- **Hedef:** 0 error

### 6. Manual Actions & Security Issues
- **İzle:** Hiç görülmemeli, ama haftalık check
- **Aksiyon:** Herhangi bir uyarı → derhal düzelt + reconsideration request

### 7. Links (Links raporu)
- **İzle:** Top linking sites, top linked pages, top linking text
- **Hedef:** Ay 3 sonunda 20+ unique referring domain
- **Aksiyon:** Outreach başarısını buradan track et

## Adım 8 — URL Inspection (yeni sayfa yayınlandığında)

Yeni bir blog post veya landing page yayınladığında:
1. GSC → üst arama çubuğuna URL yapıştır
2. "URL is not on Google" → "Request indexing"
3. Google ~24 saat içinde crawl'lar (bazen 1 saat).

Bu, yeni içeriğin Google index'ine düşme süresini 3-7 günden 1 güne indirir.

## Adım 9 — Bing Webmaster Tools (bonus)

GSC dışında Bing için ayrı setup. Copilot AI cite kaynağı olarak Bing kullanıyor, o yüzden Bing indexing da önemli.

1. https://www.bing.com/webmasters
2. "Import from Google Search Console" seçeneğini kullan — GSC verification'ı Bing için de geçerli sayar.
3. Sitemap otomatik import olur.

## Adım 10 — Weekly review cadence

Her Pazartesi 30 dakika GSC review:

- [ ] Performance last 7 days: click, impression trendi
- [ ] Yeni indexed pages
- [ ] Yeni referring domains (Links raporu)
- [ ] Core Web Vitals status değişmiş mi
- [ ] Herhangi bir error / manual action var mı

Bu review'ı `ai-citations.md` weekly tracker'ıyla aynı gün yaparsan konsolide SEO/AI görünürlük snapshot alırsın.

## Troubleshooting

- **"Verification failed"** → DNS propagate etmedi. 15 dk bekle, `dig TXT` ile confirm et.
- **"Indexed, though blocked by robots.txt"** → robots.txt yanlış konfigüre. Düzelt.
- **"Duplicate without user-selected canonical"** → aynı içerik birden çok URL'de. Canonical tag ekle veya redirect.
- **"Discovered — currently not indexed"** → Google gördü ama index'e almadı. Genelde içerik kalitesi düşük veya thin content. İçeriği genişlet.
- **TXT record çakışıyor** → Aynı @ altında birden çok TXT olabilir (SPF, DMARC vs.). Sorun değil, hepsi coexist eder. Ama yanlışlıkla eski TXT'yi silme.
