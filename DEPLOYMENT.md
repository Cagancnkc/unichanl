# Unichanl Deployment Guide

## ✅ Current Status
- **Server**: Running on port 3002 (dev) / port 3001 (production)
- **Build**: Compiled (340 files in `dist/`)
- **Database**: Supabase + pooling (pgbouncer)
- **Cache**: Redis connected
- **Static Site**: Serving `/` with bundled HTML+assets

## 📋 Pre-Deployment Checklist

### Environment Setup
```bash
# Create production .env
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS="yourdomain.com,api.yourdomain.com"
LOG_LEVEL=warn
```

### Database
- ✅ Supabase PostgreSQL configured
- ✅ Connection pooling enabled (pgbouncer)
- ⚠️ Run migrations: `npm run db:deploy`

### Secrets & Security
- ✅ JWT_SECRET generated (32 bytes hex)
- ✅ API keys created via `/api/keys/create`
- ⚠️ Store in secure vault (not git)
- ⚠️ Set `ALLOWED_ORIGINS` to specific domains

### Performance
- ✅ Compression enabled (@fastify/compress)
- ✅ Rate limiting configured
- ✅ Request timing middleware active
- ⚠️ Redis should be production-grade (not localhost)

## 🚀 Deployment Steps

### Option 1: Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Option 2: Node.js Direct
```bash
npm ci --only=production
npm run build
NODE_ENV=production npm start
```

### Option 3: PM2 (Recommended)
```bash
npm install -g pm2
pm2 start dist/server.js --name unichanl --env production
pm2 save
pm2 startup
```

## 🔍 Health Checks
- **Liveness**: `GET /api/health` → 200
- **Dependencies**: Checks DB and Redis
- **Uptime**: Returns server uptime in seconds

## 📊 Monitoring

### Endpoints to Monitor
- `POST /api/keys/create` - Key generation (no auth)
- `GET /api/health` - System status
- `POST /v1/chat/completions` - Protected endpoint

### Logs
- File: Sent to stdout (configure in deployment platform)
- Level: Set via `LOG_LEVEL` env var
- Format: JSON (pino) for log aggregation

## ⚠️ Known Limitations
1. OpenRouter API key test failures (test environment only)
2. Static site assets embedded in HTML (no external CDN needed)
3. Rate limiting: See `@fastify/rate-limit` config

## 🔄 Rollback Plan
- Keep previous Docker image tagged
- Database: Supabase provides point-in-time recovery
- API keys: Stored in database, can be rotated

## 📞 Support
- Health endpoint: `/api/health`
- Logs: Check application logs for detailed errors
- Database: Access via Supabase dashboard
