# Configuration Summary

This document provides a complete overview of all configurations in the BOOKMATE system.

## Environment Variables (.env)

### Server Configuration
```bash
PORT=3000
NODE_ENV=development  # or 'production'
CORS_ORIGIN=*  # or specific domain(s) like 'https://yourdomain.com'
```

### Database Configuration
```bash
DATABASE_URL=postgresql://user:password@host:5432/bookmate
```

### JWT Configuration
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

### OPay Configuration
```bash
OPAY_MERCHANT_ID=your-opay-merchant-id
OPAY_PUBLIC_KEY=your-opay-public-key
OPAY_SECRET_KEY=your-opay-secret-key
OPAY_BASE_URL=https://testapi.opaycheckout.com  # or https://liveapi.opaycheckout.com for production
OPAY_CALLBACK_URL=http://localhost:3000/payments/callback
OPAY_RETURN_URL=http://localhost:3000/payments/return
```

### Docker PostgreSQL (Optional)
```bash
POSTGRES_USER=bookmate_user
POSTGRES_PASSWORD=bookmate_password
POSTGRES_DB=bookmate
POSTGRES_PORT=5432
```

## Docker Configuration

### Production Dockerfile
- **Base Image**: node:20-alpine
- **Multi-stage Build**: Yes (builder + production)
- **User**: Non-root (nodejs:1001)
- **Health Check**: Enabled (30s interval)
- **Port**: 3000

### Development Dockerfile
- **Base Image**: node:20-alpine
- **Hot Reload**: Enabled
- **Volume Mounting**: Yes (for live code updates)

### docker-compose.yml (Production)
- **PostgreSQL**: 16-alpine
- **API**: Production build
- **Networks**: bookmate-network
- **Volumes**: postgres_data
- **Health Checks**: Enabled for both services

### docker-compose.dev.yml (Development)
- **PostgreSQL**: 16-alpine
- **API**: Development build with hot reload
- **Networks**: bookmate-dev-network
- **Volumes**: postgres_dev_data + code volume

## CI/CD Configuration

### GitHub Actions Pipeline (.github/workflows/ci-cd.yml)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**
1. **lint-and-test**: Linting, type checking, tests
2. **build**: Docker image build and push to GitHub Container Registry
3. **security-scan**: Trivy vulnerability scanner + npm audit
4. **deploy**: Production deployment (main branch only)

**Registry:** GitHub Container Registry (ghcr.io)

## Security Configuration

### Rate Limiting (src/config/security.ts)

- **General API**: 
  - Production: 100 requests/15 minutes
  - Development: 1000 requests/15 minutes
- **Authentication**: 5 requests/15 minutes
- **Payments**: 10 requests/15 minutes
- **File Uploads**: 20 uploads/hour

### Security Headers

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: Enabled in production (1 year)
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricted (geolocation, microphone, camera disabled)

### Helmet Configuration

- **Content Security Policy**: Configured with OPay baseUrl allowed
- **Cross-Origin Embedder Policy**: Disabled
- **Cross-Origin Resource Policy**: cross-origin

### CORS Configuration

- **Origin**: Configurable (supports wildcard or specific domains)
- **Credentials**: Enabled
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Max Age**: 86400 seconds (24 hours)

### Request Size Limits

- **JSON Body**: 10MB
- **URL Encoded**: 10MB
- **File Uploads**: 100MB (configured in multer)

## Application Configuration

### Port Configuration
- **Default**: 3000
- **Configurable**: Via PORT environment variable

### Database Configuration
- **TypeORM**: Synchronize enabled in development
- **SSL**: Enabled with rejectUnauthorized: false (for Render.com)
- **Logging**: Enabled in development

### API Routes

- `/auth` - Authentication endpoints
- `/books` - Book management
- `/orders` - Order management
- `/payments` - Payment processing
- `/admin` - Admin operations
- `/api-docs` - Swagger documentation
- `/health` - Health check endpoint

## Package Configuration

### Dependencies
- express, cors, helmet, express-rate-limit
- typeorm, pg (PostgreSQL)
- jsonwebtoken, bcrypt
- axios (for OPay API)
- multer (file uploads)
- zod (validation)
- swagger-jsdoc, swagger-ui-express

### Scripts
- `npm run dev` - Development server
- `npm run build` - Build TypeScript
- `npm run start` - Production server
- `npm run create-admin` - Create admin user
- `npm run migration:*` - Database migrations

## Viewing Configurations

### View .env file
```bash
cat .env
```

### View Docker configuration
```bash
cat Dockerfile
cat docker-compose.yml
cat docker-compose.dev.yml
```

### View CI/CD pipeline
```bash
cat .github/workflows/ci-cd.yml
```

### View security configuration
```bash
cat src/config/security.ts
cat src/config/env.ts
```

### View package configuration
```bash
cat package.json
```

## Configuration Checklist

### Before Deployment

- [ ] All environment variables set in `.env`
- [ ] JWT_SECRET is strong and unique
- [ ] Database credentials are correct
- [ ] OPay credentials are configured
- [ ] CORS_ORIGIN is set correctly
- [ ] NODE_ENV is set to 'production'
- [ ] OPAY_BASE_URL points to production API
- [ ] OPAY_CALLBACK_URL and OPAY_RETURN_URL are correct
- [ ] Docker images are built and tested
- [ ] CI/CD pipeline is configured
- [ ] Security settings are reviewed

### Production Checklist

- [ ] HTTPS is enabled (via reverse proxy)
- [ ] Rate limits are appropriate for traffic
- [ ] Database backups are configured
- [ ] Monitoring is set up
- [ ] Logging is configured
- [ ] Error tracking is enabled
- [ ] Health checks are working
- [ ] Security headers are verified

## Quick Commands

### View all configurations
```bash
# Environment
cat .env

# Docker
cat Dockerfile
cat docker-compose.yml

# CI/CD
cat .github/workflows/ci-cd.yml

# Security
cat src/config/security.ts
cat src/config/env.ts

# Package
cat package.json
```

### Test configurations
```bash
# Test Docker build
docker build -t bookmate:test .

# Test docker-compose
docker-compose config

# Validate TypeScript
npm run build

# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"
```

