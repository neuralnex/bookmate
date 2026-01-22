# BOOKMATE - Complete Commands Guide

This document contains all commands needed to run, manage, and navigate the BOOKMATE system.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Commands](#docker-commands)
- [Development Commands](#development-commands)
- [Database Commands](#database-commands)
- [User Management](#user-management)
- [Testing & Verification](#testing--verification)
- [Troubleshooting](#troubleshooting)
- [System Navigation](#system-navigation)

---

## Quick Start

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start with Docker (recommended)
npm run docker:dev

# 4. Create admin user
docker compose -f docker-compose.dev.yml exec api npm run create-admin

# 5. Access the API
# - API: http://localhost:3000
# - Docs: http://localhost:3000/api-docs
# - Health: http://localhost:3000/health
```

### Daily Development

```bash
# Start everything
npm run docker:dev

# View logs
npm run docker:logs:dev

# Stop everything
npm run docker:down
```

---

## Docker Commands

### Start Services

```bash
# Development (with hot reload)
npm run docker:dev
# or
docker compose -f docker-compose.dev.yml up -d --build

# Production
npm run docker:prod
# or
docker compose up -d --build

# Start in foreground (see logs)
docker compose -f docker-compose.dev.yml up
```

### Stop Services

```bash
# Stop all containers
npm run docker:down
# or
docker compose -f docker-compose.dev.yml down
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose -f docker-compose.dev.yml down -v
```

### View Logs

```bash
# Development logs
npm run docker:logs:dev
# or
docker compose -f docker-compose.dev.yml logs -f api

# Production logs
npm run docker:logs
# or
docker compose logs -f api

# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f postgres

# Last 50 lines
docker compose -f docker-compose.dev.yml logs --tail=50 api
```

### Check Status

```bash
# Container status
npm run docker:status
# or
docker compose -f docker-compose.dev.yml ps

# Detailed status
docker compose -f docker-compose.dev.yml ps -a

# Resource usage
docker stats
```

### Container Management

```bash
# Execute command in container
docker compose -f docker-compose.dev.yml exec api sh
docker compose -f docker-compose.dev.yml exec api npm run create-admin

# Restart a service
docker compose -f docker-compose.dev.yml restart api

# Rebuild after code changes
docker compose -f docker-compose.dev.yml up -d --build api

# View container details
docker inspect bookmate-api-dev
```

---

## Development Commands

### Local Development (without Docker)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit
```

### Package Management

```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Scripts

```bash
# View all available scripts
npm run

# View configurations
npm run view-config
# or
./view-config.sh

# Create admin user
npm run create-admin
```

---

## Database Commands

### Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# In Docker container
docker compose -f docker-compose.dev.yml exec api npm run migration:run
```

### Database Access

```bash
# Connect to PostgreSQL (Docker)
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate

# List databases
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -c "\l"

# List tables
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate -c "\dt"

# View table structure
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate -c "\d users"

# Run SQL query
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate -c "SELECT * FROM users;"
```

### Database Backup & Restore

```bash
# Backup database
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U bookmate_user bookmate > backup.sql

# Restore database
docker compose -f docker-compose.dev.yml exec -T postgres psql -U bookmate_user bookmate < backup.sql

# Backup with timestamp
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U bookmate_user bookmate > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Clean Database

```bash
# Clean all data (keeps admin users)
docker compose -f docker-compose.dev.yml exec api npx ts-node scripts/clean-database.ts
```

---

## User Management

### Create Admin User

```bash
# Using npm script
npm run create-admin

# In Docker container
docker compose -f docker-compose.dev.yml exec api npm run create-admin

# With command line arguments
docker compose -f docker-compose.dev.yml exec api npx ts-node scripts/create-admin.ts "Admin Name" "admin@example.com" "20210000000" "password123"
```

### View Users

```bash
# List all users
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate -c "SELECT id, name, email, role, \"createdAt\" FROM users;"

# Count users
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate -c "SELECT role, COUNT(*) FROM users GROUP BY role;"
```

---

## Testing & Verification

### Health Checks

```bash
# Check API health
curl http://localhost:3000/health

# Check with verbose output
curl -v http://localhost:3000/health

# Check API docs
curl http://localhost:3000/api-docs
```

### API Testing

```bash
# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "regNumber": "20210000001",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrRegNumber": "test@example.com",
    "password": "password123"
  }'

# Get all books
curl http://localhost:3000/books

# Get book by ID (replace with actual ID)
curl http://localhost:3000/books/{book-id}
```

### Container Health

```bash
# Check container health
docker compose -f docker-compose.dev.yml ps

# Check specific container
docker inspect bookmate-api-dev | grep -A 10 Health

# Test database connection
docker compose -f docker-compose.dev.yml exec postgres pg_isready -U bookmate_user
```

---

## Troubleshooting

### Port Issues

```bash
# Check what's using port 3000
lsof -ti:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Check what's using port 5432
lsof -ti:5432
```

### Container Issues

```bash
# View container logs
docker compose -f docker-compose.dev.yml logs api

# Restart container
docker compose -f docker-compose.dev.yml restart api

# Rebuild container
docker compose -f docker-compose.dev.yml up -d --build api

# Remove and recreate
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build
```

### Database Issues

```bash
# Check database logs
docker compose -f docker-compose.dev.yml logs postgres

# Test database connection
docker compose -f docker-compose.dev.yml exec api node -e "require('./dist/config/database').AppDataSource.initialize().then(() => console.log('Connected')).catch(e => console.error(e))"

# Reset database (⚠️ deletes all data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Clean Slate

```bash
# Stop all containers
docker compose -f docker-compose.dev.yml down

# Remove volumes (⚠️ deletes data)
docker compose -f docker-compose.dev.yml down -v

# Remove images
docker rmi bookmate-api

# Clean Docker system
docker system prune -a
```

---

## System Navigation

### View Configurations

```bash
# View all configurations
npm run view-config
# or
./view-config.sh

# View specific files
cat .env
cat Dockerfile
cat docker-compose.yml
cat src/config/env.ts
cat src/config/security.ts
```

### File Structure Navigation

```bash
# View project structure
tree -L 2 -I 'node_modules|dist'

# Find files
find . -name "*.ts" -type f | head -10
find . -name "*.md" -type f

# Count files
find src -name "*.ts" | wc -l
```

### Git Commands (if using Git)

```bash
# Check status
git status

# View changes
git diff

# Commit changes
git add .
git commit -m "Your message"

# View history
git log --oneline
```

### Environment Variables

```bash
# View .env file
cat .env

# Check if variable is set
echo $DATABASE_URL

# Load and check variables
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Log Files

```bash
# View application logs (Docker)
docker compose -f docker-compose.dev.yml logs -f api

# View database logs
docker compose -f docker-compose.dev.yml logs -f postgres

# Search logs
docker compose -f docker-compose.dev.yml logs api | grep "error"
docker compose -f docker-compose.dev.yml logs api | grep "Database connected"
```

---

## Common Workflows

### Daily Development Workflow

```bash
# Morning: Start everything
npm run docker:dev

# During development: View logs
npm run docker:logs:dev

# Test changes: Check health
curl http://localhost:3000/health

# Evening: Stop everything
npm run docker:down
```

### Adding New Feature

```bash
# 1. Start services
npm run docker:dev

# 2. Create feature branch (if using Git)
git checkout -b feature/new-feature

# 3. Make changes to code

# 4. Test locally
curl http://localhost:3000/health

# 5. Check logs for errors
npm run docker:logs:dev

# 6. Commit changes (if using Git)
git add .
git commit -m "Add new feature"
```

### Production Deployment

```bash
# 1. Build production image
npm run docker:prod

# 2. Check status
npm run docker:status

# 3. Test health endpoint
curl http://localhost:3000/health

# 4. Monitor logs
npm run docker:logs
```

### Database Migration Workflow

```bash
# 1. Generate migration
npm run migration:generate -- -n AddNewField

# 2. Review generated migration file
cat src/migrations/*AddNewField*.ts

# 3. Run migration
npm run migration:run

# 4. Verify changes
docker compose -f docker-compose.dev.yml exec postgres psql -U bookmate_user -d bookmate -c "\d table_name"
```

---

## Quick Reference

### Most Used Commands

```bash
# Start development
npm run docker:dev

# View logs
npm run docker:logs:dev

# Stop services
npm run docker:down

# Check status
npm run docker:status

# Create admin
docker compose -f docker-compose.dev.yml exec api npm run create-admin

# Health check
curl http://localhost:3000/health
```

### Service URLs

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:5432

### Container Names

- **Development API**: `bookmate-api-dev`
- **Development DB**: `bookmate-db-dev`
- **Production API**: `bookmate-api`
- **Production DB**: `bookmate-db`

---

## Tips & Best Practices

1. **Always check logs** when something doesn't work: `npm run docker:logs:dev`
2. **Use health endpoint** to verify API is running: `curl http://localhost:3000/health`
3. **Keep .env file secure** - never commit it to version control
4. **Backup database** before major changes: Use pg_dump commands
5. **Use Docker Compose V2** syntax: `docker compose` (not `docker-compose`)
6. **Check container status** regularly: `npm run docker:status`
7. **View configurations** when unsure: `npm run view-config`

---

## Need Help?

- Check logs: `npm run docker:logs:dev`
- View configurations: `npm run view-config`
- Check container status: `npm run docker:status`
- Review documentation in `DOCS/` folder

