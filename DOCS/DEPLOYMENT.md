# Deployment Guide

This guide covers Docker containerization, CI/CD setup, and deployment procedures for the BOOKMATE backend.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
- PostgreSQL 16+ (or use Docker)
- Git (for CI/CD)

## Quick Start

### 1. Install Dependencies

First, install the new security packages:

```bash
npm install helmet express-rate-limit @types/express-rate-limit
```

### 2. Docker Development

Start the development environment:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This will:
- Start PostgreSQL database
- Start the API with hot reload
- Create necessary networks and volumes

View logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f api
```

Stop services:
```bash
docker-compose -f docker-compose.dev.yml down
```

### 3. Docker Production

Build and start production containers:

```bash
docker-compose up -d --build
```

This uses a multi-stage build for optimized production images.

## CI/CD Pipeline

### GitHub Actions Setup

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml`.

#### Pipeline Stages

1. **Lint and Test**
   - Checks out code
   - Installs dependencies
   - Runs linter (if configured)
   - Type checks TypeScript
   - Runs tests (if configured)

2. **Build Docker Image**
   - Builds production Docker image
   - Pushes to GitHub Container Registry
   - Tags images with branch, SHA, and version

3. **Security Scan**
   - Runs Trivy vulnerability scanner
   - Uploads results to GitHub Security
   - Runs npm audit

4. **Deploy**
   - Deploys to production (main branch only)
   - Configure deployment steps in the workflow file

#### Setting Up GitHub Actions

1. **Enable GitHub Actions** in your repository settings

2. **Configure Secrets** (if needed):
   - `DOCKER_USERNAME`: Docker registry username
   - `DOCKER_PASSWORD`: Docker registry password
   - `DEPLOY_KEY`: SSH key for deployment (if using SSH)

3. **Customize Deployment**

   Edit `.github/workflows/ci-cd.yml` and update the deploy step:

   ```yaml
   - name: Deploy to production
     run: |
       # Example: Kubernetes
       kubectl apply -f k8s/
       
       # Example: Docker Compose on remote server
       ssh deploy@server "cd /app && docker-compose pull && docker-compose up -d"
       
       # Example: Cloud platform (AWS, GCP, Azure)
       # Use platform-specific deployment commands
   ```

### Manual Deployment

#### Option 1: Docker Compose on Server

1. **Copy files to server**:
   ```bash
   scp -r . user@server:/path/to/app
   ```

2. **SSH into server**:
   ```bash
   ssh user@server
   cd /path/to/app
   ```

3. **Set environment variables**:
   ```bash
   cp .env.example .env
   nano .env  # Edit with production values
   ```

4. **Start services**:
   ```bash
   docker-compose up -d --build
   ```

#### Option 2: Kubernetes

1. **Create Kubernetes manifests** (not included, create as needed)

2. **Apply manifests**:
   ```bash
   kubectl apply -f k8s/
   ```

#### Option 3: Cloud Platforms

**AWS (ECS/Fargate)**:
- Build and push image to ECR
- Create ECS task definition
- Deploy to ECS service

**Google Cloud (Cloud Run)**:
- Build and push to GCR
- Deploy to Cloud Run

**Azure (Container Instances)**:
- Build and push to ACR
- Deploy to Container Instances

## Environment Configuration

### Production Environment Variables

Ensure these are set in production:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/bookmate
JWT_SECRET=<strong-secret>
CORS_ORIGIN=https://yourdomain.com
OPAY_MERCHANT_ID=<your-merchant-id>
OPAY_PUBLIC_KEY=<your-public-key>
OPAY_SECRET_KEY=<your-secret-key>
OPAY_BASE_URL=https://liveapi.opaycheckout.com
OPAY_CALLBACK_URL=https://yourdomain.com/payments/callback
OPAY_RETURN_URL=https://yourdomain.com/payments/return
```

### Database Setup

For production, use a managed PostgreSQL service or set up your own:

1. **Create database**:
   ```sql
   CREATE DATABASE bookmate;
   CREATE USER bookmate_user WITH PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE bookmate TO bookmate_user;
   ```

2. **Run migrations** (if using migrations):
   ```bash
   npm run migration:run
   ```

3. **Create admin user**:
   ```bash
   npm run create-admin
   ```

## Docker Image Optimization

The production Dockerfile uses multi-stage builds:

- **Stage 1 (builder)**: Installs all dependencies and builds TypeScript
- **Stage 2 (production)**: Only includes production dependencies and built files

This results in a smaller, more secure image.

### Image Size Optimization Tips

- Use Alpine Linux base images (already implemented)
- Multi-stage builds (already implemented)
- Remove unnecessary files with `.dockerignore` (already configured)
- Use specific version tags for base images

## Monitoring and Logging

### Health Checks

The Docker containers include health checks:

- **API**: Checks `/health` endpoint every 30 seconds
- **Database**: Checks PostgreSQL readiness every 10 seconds

### Logging

View container logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Monitoring Tools

Recommended tools:

- **Prometheus + Grafana**: Metrics and dashboards
- **ELK Stack**: Centralized logging
- **Datadog**: All-in-one monitoring
- **New Relic**: Application performance monitoring

## Scaling

### Horizontal Scaling

To scale the API service:

```bash
docker-compose up -d --scale api=3
```

**Note**: Ensure your load balancer distributes traffic correctly.

### Database Scaling

- Use read replicas for read-heavy workloads
- Implement connection pooling (TypeORM handles this)
- Consider database sharding for very large datasets

## Backup and Recovery

### Database Backups

1. **Automated backups**:
   ```bash
   # Add to cron
   0 2 * * * docker exec bookmate-db pg_dump -U bookmate_user bookmate > /backups/bookmate_$(date +\%Y\%m\%d).sql
   ```

2. **Restore from backup**:
   ```bash
   docker exec -i bookmate-db psql -U bookmate_user bookmate < backup.sql
   ```

### Application Backups

- Backup environment variables
- Backup Docker volumes
- Backup SSL certificates

## Security in Production

1. **Use HTTPS**: Set up reverse proxy (nginx, Traefik) with SSL
2. **Firewall**: Restrict access to necessary ports only
3. **Secrets Management**: Use secret management tools (AWS Secrets Manager, HashiCorp Vault)
4. **Regular Updates**: Keep Docker images and dependencies updated
5. **Monitor Logs**: Set up log monitoring and alerting

## Troubleshooting

### Container won't start

1. Check logs: `docker-compose logs api`
2. Verify environment variables
3. Check database connectivity
4. Verify port availability

### Database connection errors

1. Check DATABASE_URL format
2. Verify database is running: `docker-compose ps`
3. Check network connectivity
4. Verify credentials

### High memory usage

1. Check for memory leaks
2. Adjust Node.js memory limits
3. Scale horizontally
4. Optimize database queries

## Performance Tuning

### Node.js

Set memory limits:

```bash
NODE_OPTIONS="--max-old-space-size=2048"
```

### PostgreSQL

Tune PostgreSQL settings in `postgresql.conf`:

- `shared_buffers`: 25% of RAM
- `effective_cache_size`: 50-75% of RAM
- `maintenance_work_mem`: 1-2GB
- `checkpoint_completion_target`: 0.9

### Docker

- Use resource limits in docker-compose.yml
- Monitor container resource usage
- Adjust based on actual usage

## Rollback Procedure

If deployment fails:

1. **Stop new containers**:
   ```bash
   docker-compose down
   ```

2. **Revert to previous image**:
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

3. **Or use specific image tag**:
   ```bash
   docker-compose up -d --no-deps api
   ```

## Support

For deployment issues:
1. Check logs
2. Review environment variables
3. Verify network connectivity
4. Check resource limits

