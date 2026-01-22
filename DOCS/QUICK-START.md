# Quick Start Guide

## View All Configurations

### Option 1: Use the script
```bash
npm run view-config
# or
./view-config.sh
```

### Option 2: View individual files
```bash
# Environment variables
cat .env

# Docker files
cat Dockerfile
cat docker-compose.yml

# CI/CD
cat .github/workflows/ci-cd.yml

# Security config
cat src/config/security.ts
cat src/config/env.ts
```

## Installation

### 1. Install Dependencies
```bash
npm install
```

**Required packages:**
- helmet
- express-rate-limit
- @types/express-rate-limit

### 2. Configure Environment
```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

### 3. Set Up Database
```bash
# Using Docker (recommended)
docker-compose -f docker-compose.dev.yml up -d postgres

# Or use existing PostgreSQL
# Update DATABASE_URL in .env
```

### 4. Create Admin User
```bash
npm run create-admin
```

## Running the Application

### Development (Local)
```bash
npm run dev
```

### Development (Docker)
```bash
npm run docker:dev
# View logs
npm run docker:logs
```

### Production (Docker)
```bash
npm run docker:prod
```

### Production (Local)
```bash
npm run build
npm start
```

## Access Points

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## Common Commands

```bash
# View configurations
npm run view-config

# Docker operations
npm run docker:dev      # Start development
npm run docker:prod     # Start production
npm run docker:down     # Stop containers
npm run docker:logs     # View logs

# Database
npm run migration:run   # Run migrations
npm run create-admin    # Create admin user

# Development
npm run dev             # Start dev server
npm run build           # Build for production
npm start               # Start production server
```

## Configuration Files Summary

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `Dockerfile` | Production Docker image |
| `Dockerfile.dev` | Development Docker image |
| `docker-compose.yml` | Production services |
| `docker-compose.dev.yml` | Development services |
| `.github/workflows/ci-cd.yml` | CI/CD pipeline |
| `src/config/env.ts` | Environment config loader |
| `src/config/security.ts` | Security settings |
| `package.json` | Dependencies and scripts |

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env` file
3. ✅ Set up database
4. ✅ Create admin user
5. ✅ Start development server
6. ✅ Test API endpoints
7. ✅ Review security settings
8. ✅ Configure CI/CD (if using GitHub)

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Docker issues
```bash
# Check Docker status
docker ps
docker-compose ps

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

### Database connection errors
```bash
# Check database is running
docker-compose ps postgres

# Test connection
psql $DATABASE_URL
```

### Missing dependencies
```bash
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

