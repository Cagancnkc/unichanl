# 🚀 Render Deploy - Quick Start

## 5 Adımda Production'a Çık

### Step 1: Git Repository Hazırla
```bash
cd c:\Users\POWERLAB\Downloads\solana-sniper-bot

# Git'i init et
git init
git add .
git commit -m "Initial commit: Unichanl production setup with Render config"
```

### Step 2: GitHub'a Push Et
```bash
# GitHub'da yeni repo oluştur: github.com/new
# Adı: unichanl (ya da istediğin ad)
# Açıklaması: "Unichanl - Local AI Gateway"
# Public/Private: Tercih (Public tavsiye)

# Terminal'de:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/unichanl.git
git push -u origin main

# Karşılaştırır: GitHub'a girdikten sonra "Code" kopyala
# HTTPS: https://github.com/YOUR_USERNAME/unichanl.git
# SSH: git@github.com:YOUR_USERNAME/unichanl.git
```

### Step 3: Render'da Web Service Oluştur
1. render.com → Sign in (GitHub ile)
2. "New" → "Web Service"
3. GitHub repo'nu seç: `unichanl`
4. Settings:
   - **Name**: unichanl
   - **Runtime**: Docker
   - **Region**: Frankfurt (Türkiye'ye yakın)
   - **Plan**: Starter ($7/month) veya Standard ($12/month)
5. "Create Web Service" tıkla

### Step 4: Environment Variables Ayarla
Render dashboard'da:
1. Settings → Environment
2. Aşağıdaki variables'ı ekle:

```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
ALLOWED_ORIGINS=https://yourdomain.com
DATABASE_URL=postgresql://...  # Supabase'den kopyala
DIRECT_URL=postgresql://...    # Supabase'den kopyala
REDIS_URL=redis://...          # Render Redis veya Upstash'ten kopyala
JWT_SECRET=<32-byte-hex>       # Aşağıda nasıl oluşturacağız
OPENROUTER_API_KEY=sk-or-v1-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 5: Deploy!
```
Render otomatik olarak GitHub'u izler.
Her push'ta yeniden build ve deploy olur.

İlk deploy: ~2-3 dakika
Sonraki deploylar: ~1-2 dakika

Dashboard → Logs kısmında ilerleme izle.
```

## 🔐 JWT_SECRET Oluştur

**PowerShell'de:**
```powershell
$bytes = [System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32)
[System.BitConverter]::ToString($bytes) -replace '-', ''
```

Çıktı: `ABC123DEF456...` (64 karakter hex string)

Bunu Render'a kopyala.

## 📋 Supabase Credentials'ı Kopyala

1. supabase.com → Your Project
2. Settings → Database
3. "Connection pooler" bölümü:
   - Host, User, Password kopyala
   - Connection string oluştur:
   ```
   postgresql://postgres.XYZ:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
4. "Connection string" kopyala (DATABASE_URL)
5. "Direct connection" de kopyala (DIRECT_URL)

## 🔴 Redis Setup

**Option 1: Render'ın Redis'i (En Kolay)**
1. Render dashboard → New Database → Redis
2. Tier: Standard ($7/month)
3. Connection URL'i kopyala → REDIS_URL

**Option 2: Upstash (Free + Paid)**
1. upstash.com → Sign up
2. Redis Database oluştur
3. Connection string kopyala → REDIS_URL

## ✅ Verify Deployment

Deploy bittikten sonra:
```bash
# Site açılıyor mu?
https://unichanl.onrender.com/

# Health check ok mi?
https://unichanl.onrender.com/api/health

# Response:
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| Build failed | Check Render Logs → "npm install" hatası mı? |
| "Service unhealthy" | `/api/health` hangi hata veriyor? Logs'tan bak |
| Database connection error | DATABASE_URL doğru mu? Supabase'ten tekrar kopyala |
| CORS error | ALLOWED_ORIGINS'e domain ekle, save et, restart et |

## 📞 Support

- **Render Issues**: render.com/support
- **GitHub Issues**: github.com/help
- **Supabase Issues**: supabase.com/support
