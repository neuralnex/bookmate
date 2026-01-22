# Docker Setup Guide

This guide ensures your Docker setup is properly configured and ready to use.

## Prerequisites

✅ **Docker** (20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
✅ **Docker Compose** (2.0+) - Usually included with Docker Desktop

## Quick Start

### Option 1: Using npm scripts (Recommended)

```bash
# Development
npm run docker:dev

# Production
npm run docker:prod

# Stop containers
npm run docker:down

# View logs
npm run docker:logs:dev    # Development
npm run docker:logs        # Production

# Check status
npm run docker:status
```

### Option 2: Using the startup script

```bash
# Make script executable (first time only)
chmod +x docker-start.sh

# Start development
./docker-start.sh dev

# Start production
./docker-start.sh prod

# Stop all
./docker-start.sh stop

# View logs
./docker-start.sh logs dev

# Check status
./docker-start.sh status
```

### Option 3: Direct docker-compose commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d --build

# Production
docker-compose up -d --build

# Stop
docker-compose -f docker-compose.dev.yml down
docker-compose down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
docker-compose logs -f
```

## Configuration

### Environment Variables

The Docker setup uses environment variables from your `.env` file. For development, it also has defaults.

**Required for Production:**
- `JWT_SECRET` - Strong secret key
- `OPAY_MERCHANT_ID` - OPay merchant ID
- `OPAY_PUBLIC_KEY` - OPay public key
- `OPAY_SECRET_KEY` - OPay secret key

**Optional (has defaults):**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: development)
- `DATABASE_URL` - Auto-configured for Docker PostgreSQL
- `CORS_ORIGIN` - CORS origin (default: *)

### Database Configuration

**Development:**
- Uses Docker PostgreSQL container
- Auto-configured connection string
- SSL disabled (local database)

**Production:**
- Can use Docker PostgreSQL or external database
- SSL enabled automatically for cloud databases (Render, AWS, Azure)
- Set `DATABASE_SSL=true` in `.env` to force SSL

## Services

### Development (`docker-compose.dev.yml`)

- **PostgreSQL**: `bookmate-db-dev` on port 5432
- **API**: `bookmate-api-dev` on port 3000
- **Hot Reload**: Enabled
- **Volume Mounting**: Code changes reflect immediately

### Production (`docker-compose.yml`)

- **PostgreSQL**: `bookmate-db` on port 5432
- **API**: `bookmate-api` on port 3000
- **Optimized Build**: Multi-stage build
- **Non-root User**: Security hardened
- **Health Checks**: Enabled

## Access Points

Once started, access:

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:5432 (from host)

## Common Tasks

### Create Admin User

```bash
# Development
docker-compose -f docker-compose.dev.yml exec api npm run create-admin

# Production
docker-compose exec api npm run create-admin
```

### Run Database Migrations

```bash
# Development
docker-compose -f docker-compose.dev.yml exec api npm run migration:run

# Production
docker-compose exec api npm run migration:run
```

### View Container Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
```

### Execute Commands in Container

```bash
# Development
docker-compose -f docker-compose.dev.yml exec api sh

# Production
docker-compose exec api sh
```

### Rebuild After Changes

```bash
# Development
docker-compose -f docker-compose.dev.yml up -d --build

# Production
docker-compose up -d --build
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
```

### Database Connection Errors

1. **Check database is running:**
   ```bash
   docker-compose ps postgres
   ```

2. **Check database logs:**
   ```bash
   docker-compose logs postgres
   ```

3. **Verify DATABASE_URL:**
   - Development: `postgresql://bookmate_user:bookmate_password@postgres:5432/bookmate`
   - Should match docker-compose environment variables

### Container Won't Start

1. **Check logs:**
   ```bash
   docker-compose logs api
   ```

2. **Check environment variables:**
   ```bash
   docker-compose config
   ```

3. **Rebuild containers:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### SSL Connection Errors

If using external database (Render, AWS, etc.):

1. **Enable SSL in .env:**
   ```bash
   DATABASE_SSL=true
   ```

2. **Or the system auto-detects SSL for:**
   - `render.com`
   - `amazonaws.com`
   - `azure.com`

### Permission Errors

```bash
# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

## Health Checks

Both services have health checks:

- **PostgreSQL**: Checks every 10s
- **API**: Checks every 30s

View health status:
```bash
docker-compose ps
```

## Data Persistence

- **Development**: `postgres_dev_data` volume
- **Production**: `postgres_data` volume

Data persists even after stopping containers. To remove:
```bash
docker-compose down -v  # Removes volumes
```

## Production Deployment

1. **Set environment variables in `.env`**
2. **Build and start:**
   ```bash
   docker-compose up -d --build
   ```
3. **Create admin user:**
   ```bash
   docker-compose exec api npm run create-admin
   ```
4. **Monitor logs:**
   ```bash
   docker-compose logs -f
   ```

## Security Notes

- ✅ Non-root user in production containers
- ✅ Health checks enabled
- ✅ Network isolation (Docker networks)
- ✅ Volume isolation
- ✅ Environment variable security

## Next Steps

1. ✅ Start development: `npm run docker:dev`
2. ✅ Create admin: `docker-compose -f docker-compose.dev.yml exec api npm run create-admin`
3. ✅ Test API: http://localhost:3000/health
4. ✅ View docs: http://localhost:3000/api-docs

## Support

If you encounter issues:

1. Check container logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Check Docker status: `docker ps`
4. Review this guide for common solutions

