# Unichanl Render Deployment Guide

## 📋 Prerequisites
- [ ] Render account (render.com)
- [ ] GitHub account with repo access
- [ ] Supabase project (already set up)
- [ ] Redis instance (Render or external)

## 🚀 Step-by-Step Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Unichanl production setup"
git branch -M main
git remote add origin https://github.com/yourusername/unichanl.git
git push -u origin main
```

### 2. Connect to Render

1. Go to **render.com**
2. Sign in with GitHub
3. Click **New → Web Service**
4. Select your GitHub repository (`solana-sniper-bot`)
5. Configure:
   - **Name**: `unichanl`
   - **Runtime**: Docker
   - **Branch**: main
   - **Dockerfile Path**: `./Dockerfile` (default)
   - **Region**: `frankfurt` (Türkiye'ye yakın)
   - **Plan**: Starter ($7/month) → Standard ($12/month)

### 3. Set Environment Variables

In Render dashboard → Settings → Environment:

```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://redis-host:6379
JWT_SECRET=<your-32-byte-hex-secret>
OPENROUTER_API_KEY=sk-or-v1-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

**Get credentials from:**
- Supabase: Dashboard → Settings → Database
- Redis: Upstash, Redis Cloud, or Render's Redis add-on

### 4. Configure Redis

**Option A: Render's Redis Add-on** (Recommended)
- In Render dashboard, click "Add Database"
- Choose "Redis"
- Copy connection string to `REDIS_URL`

**Option B: External Redis**
- Use Upstash (upstash.com)
- Use Redis Cloud (redis.com)
- Copy connection URL to `REDIS_URL`

**Option C: Local Redis** (NOT recommended for production)
- Don't use this unless you know what you're doing

### 5. Database Migrations

After first deployment, run migrations:

```bash
# Connect via SSH or use Render's shell
# Or run before first deployment locally:
npm run db:deploy

# Then commit and push
git add .
git commit -m "Run database migrations"
git push
```

Alternatively, add to Render's startup script:
```json
// render.json (optional, auto-run migrations)
{
  "buildCommand": "npm run build && npm run db:deploy"
}
```

### 6. Custom Domain (Optional)

1. Render dashboard → Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Configure DNS records as shown

### 7. Verify Deployment

After deployment completes:

```bash
# Test health endpoint
curl https://unichanl.onrender.com/api/health

# Expected response:
# {
#   "status": "ok",
#   "db": "ok",
#   "redis": "ok",
#   "uptime": 123.45,
#   "timestamp": "2026-09-03T12:34:56.789Z"
# }

# Test site
curl https://unichanl.onrender.com/
# Should return HTML homepage
```

## 🔄 Continuous Deployment

Render auto-deploys when you push to `main` branch.

To trigger manual redeploy:
1. Render dashboard → Select service
2. Click "Manual Deploy" → Choose branch

## 📊 Monitoring

### Logs
- Render dashboard → Logs
- Useful for debugging issues

### Metrics
- Render dashboard → Metrics
- CPU, Memory, Network usage

### Health Checks
- Render pings `/api/health` every 30 seconds
- If it returns non-200, service will be marked as unhealthy

## 🚨 Troubleshooting

### "Build failed"
- Check Logs in Render dashboard
- Verify `Dockerfile` exists
- Ensure `npm install` succeeds locally

### "Service unhealthy"
- Check `/api/health` endpoint
- Verify DATABASE_URL and REDIS_URL are correct
- Check logs for connection errors

### "CORS issues"
- Update `ALLOWED_ORIGINS` in environment variables
- Restart service after updating

### "Database connection failed"
- Verify DATABASE_URL format
- Check Supabase IP allowlist (if using IP restriction)
- Use pooler connection (pgbouncer) in DATABASE_URL

## 📈 Scaling

Render can auto-scale based on CPU/Memory:
- Set `maxInstances` in `render.yaml`
- Monitor costs in Render dashboard
- Adjust plan if needed

## 💰 Estimated Costs

| Component | Cost |
|-----------|------|
| Web Service (Standard) | $12/month |
| Redis (standard) | $7/month |
| PostgreSQL (via Supabase) | $25/month* |
| Custom Domain | Free |
| **Total** | **~$44/month** |

*Supabase pricing depends on usage

## 🔐 Security Checklist

- [ ] `ALLOWED_ORIGINS` set to specific domains
- [ ] JWT_SECRET is strong (32+ bytes)
- [ ] API key rotation policy in place
- [ ] Database backups enabled (Supabase)
- [ ] Redis persistence enabled
- [ ] SSL/TLS enforced (automatic with Render)

## 📞 Support

- **Render Issues**: render.com/support
- **Supabase Issues**: supabase.com/support
- **Application Logs**: Render dashboard → Logs
