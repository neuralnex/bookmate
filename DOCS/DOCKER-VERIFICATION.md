# Docker Setup Verification Checklist

## ✅ Pre-Flight Checks

### 1. Docker Installation
```bash
docker --version        # Should be 20.10+
docker-compose --version # Should be 2.0+
```

### 2. Required Files
- ✅ `Dockerfile` - Production build
- ✅ `Dockerfile.dev` - Development build
- ✅ `docker-compose.yml` - Production services
- ✅ `docker-compose.dev.yml` - Development services
- ✅ `.dockerignore` - Docker ignore patterns
- ✅ `docker-start.sh` - Startup script

### 3. Configuration Files
- ✅ `src/config/database.ts` - SSL auto-detection configured
- ✅ `src/config/env.ts` - Environment loader
- ✅ `src/config/security.ts` - Security settings
- ✅ `package.json` - Dependencies and scripts

### 4. Environment Variables
Check `.env` file has:
- ✅ `DATABASE_URL` (optional for Docker - auto-configured)
- ✅ `JWT_SECRET` (required for production)
- ✅ `OPAY_*` variables (if using payments)

## 🚀 Quick Start Commands

### Development
```bash
npm run docker:dev
# or
./docker-start.sh dev
# or
docker-compose -f docker-compose.dev.yml up -d --build
```

### Production
```bash
npm run docker:prod
# or
./docker-start.sh prod
# or
docker-compose up -d --build
```

## ✅ Verification Steps

### Step 1: Check Docker is Running
```bash
docker ps
```
Should show running containers (after starting).

### Step 2: Start Development Environment
```bash
npm run docker:dev
```

### Step 3: Check Container Status
```bash
npm run docker:status
# or
docker-compose -f docker-compose.dev.yml ps
```

Expected output:
- `bookmate-db-dev` - Running (healthy)
- `bookmate-api-dev` - Running

### Step 4: Check Logs
```bash
npm run docker:logs:dev
# or
docker-compose -f docker-compose.dev.yml logs -f api
```

Expected:
- "Database connected successfully"
- "Server running on http://localhost:3000"

### Step 5: Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","message":"BOOKMATE API is running"}
```

### Step 6: Test API Documentation
Open browser: http://localhost:3000/api-docs

Should show Swagger UI.

## 🔧 Configuration Details

### Database SSL Handling
✅ **Fixed**: SSL is now conditionally enabled:
- Auto-detects cloud databases (Render, AWS, Azure)
- Disabled for local Docker PostgreSQL
- Can be forced with `DATABASE_SSL=true`

### Environment Variables in Docker
✅ **Configured**: 
- Development has sensible defaults
- Production uses `.env` file
- Database URL auto-configured for Docker

### Health Checks
✅ **Enabled**:
- PostgreSQL: Every 10s
- API: Every 30s

### Security
✅ **Configured**:
- Non-root user in production
- Security headers
- Rate limiting
- Input sanitization

## 📋 Complete Verification

Run this command to verify everything:

```bash
# 1. Check Docker
docker --version && docker-compose --version

# 2. Check files exist
ls -la Dockerfile* docker-compose*.yml docker-start.sh

# 3. Start development
npm run docker:dev

# 4. Wait for services (30 seconds)
sleep 30

# 5. Check status
npm run docker:status

# 6. Test health
curl http://localhost:3000/health

# 7. Check logs
npm run docker:logs:dev
```

## 🎯 Expected Results

After running verification:

1. ✅ Docker containers are running
2. ✅ Database is healthy
3. ✅ API is responding
4. ✅ Health endpoint returns 200
5. ✅ API docs are accessible
6. ✅ No errors in logs

## 🐛 Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution:**
```bash
lsof -ti:3000 | xargs kill -9
# Or change port in docker-compose files
```

### Issue: Database connection error
**Solution:**
- Check database container is running: `docker-compose ps postgres`
- Check DATABASE_URL matches docker-compose settings
- Wait for database to be healthy (10-20 seconds)

### Issue: Container won't start
**Solution:**
```bash
# Check logs
docker-compose logs api

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Issue: Permission denied
**Solution:**
```bash
chmod +x docker-start.sh
chmod +x view-config.sh
```

## ✅ Final Checklist

Before considering setup complete:

- [ ] Docker and Docker Compose installed
- [ ] All Docker files present
- [ ] `.env` file configured (or using defaults)
- [ ] Can start development: `npm run docker:dev`
- [ ] Containers start successfully
- [ ] Health endpoint responds: `curl http://localhost:3000/health`
- [ ] API docs accessible: http://localhost:3000/api-docs
- [ ] No errors in logs
- [ ] Can create admin user
- [ ] Database connection works

## 🎉 Success!

If all checks pass, your Docker setup is properly configured and ready to use!

**Next Steps:**
1. Create admin user: `docker-compose -f docker-compose.dev.yml exec api npm run create-admin`
2. Start developing!
3. Test API endpoints
4. Deploy to production when ready

