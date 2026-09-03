# Production Environment Configuration

## 🔧 Environment Variables for Render

Copy these into Render dashboard → Environment:

### Required Variables

```env
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Security
JWT_SECRET=<generate-32-bytes-hex>
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database (from Supabase)
DATABASE_URL=postgresql://postgres.<project-id>:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.<project-id>:password@aws-0-eu-central-1.db.supabase.com:5432/postgres

# Redis (from Render or Upstash)
REDIS_URL=redis://default:password@redis-host:6379

# Supabase (optional, for auth)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### Optional Variables

```env
# API Keys
OPENROUTER_API_KEY=sk-or-v1-...

# Logging
LOG_LEVEL=info  # trace | debug | info | warn | error
```

## 📝 How to Get Each Value

### 1. JWT_SECRET (Generate New)
```bash
# Run this command locally
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or on Windows PowerShell:
# [System.Security.Cryptography.RNGCryptoServiceProvider]::new().GetBytes(32) | ForEach-Object { $_.ToString('x2') } -join ''
```

### 2. Database Credentials (Supabase)
1. Go to supabase.com → Your Project
2. Settings → Database
3. Copy connection string starting with `postgresql://`
4. For pooler: Use the **pgbouncer** version (port 6543)
5. For direct: Use the standard version (port 5432)

### 3. ALLOWED_ORIGINS
- Your domain: `https://yourdomain.com`
- If using subdomain: `https://api.yourdomain.com`
- Comma-separated: `https://yourdomain.com,https://www.yourdomain.com`
- **Never use `*` in production**

### 4. Redis URL (Choose One)

**Option A: Render's Redis Add-on**
- Render dashboard → New Database → Redis
- Copy connection URL

**Option B: Upstash Redis**
- upstash.com → Create Database
- Copy Redis URL: `redis://default:password@host:port`

**Option C: Redis Cloud**
- redis.com → Create Subscription
- Copy connection URL

### 5. OpenRouter API Key
- openrouter.ai → Account → API Keys
- Create new key
- Format: `sk-or-v1-...`

### 6. Supabase Public Key (Optional)
- supabase.com → Your Project
- Settings → API
- Copy "anon" public key

## 🔐 Security Best Practices

### What NOT to Do
❌ Don't use same JWT_SECRET as other projects  
❌ Don't commit `.env` to git  
❌ Don't share API keys in chat/email  
❌ Don't use wildcard `*` for ALLOWED_ORIGINS  
❌ Don't use production database for testing  

### What TO Do
✅ Generate unique JWT_SECRET for production  
✅ Store secrets in Render's Environment  
✅ Rotate API keys monthly  
✅ Use specific domains for ALLOWED_ORIGINS  
✅ Enable database backups  
✅ Monitor logs for suspicious activity  

## 🚀 Setting Up in Render

1. Create Render account & login
2. Go to Service → Settings → Environment
3. Add each variable one by one (or paste all at once)
4. Click "Save Changes"
5. Service will auto-restart with new env vars

## ✅ Verification

After setting environment variables:

```bash
# Test API health
curl https://yourapp.onrender.com/api/health

# Expected output:
# {
#   "status": "ok",
#   "db": "ok",
#   "redis": "ok"
# }

# If database or redis say "error", check:
# 1. Connection strings are correct
# 2. IP allowlist includes Render's IPs
# 3. Credentials are correct
```

## 🔄 If Something Goes Wrong

1. Check Render Logs: Dashboard → Logs
2. Look for connection errors
3. Verify each environment variable matches the source
4. Common issues:
   - **PostgreSQL SSL**: Add `?sslmode=require` to DATABASE_URL
   - **Redis timeout**: Check firewall/IP allowlist
   - **Auth 401**: Invalid API keys

## 📊 Production vs Development

| Aspect | Dev | Production |
|--------|-----|-----------|
| NODE_ENV | development | production |
| LOG_LEVEL | debug | info/warn |
| ALLOWED_ORIGINS | * | specific domains |
| Database | Local | Supabase pooler |
| Redis | localhost | External service |
| SSL | Optional | Required |
