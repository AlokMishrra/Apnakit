# Ecommerce Platform - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Docker Deployment](#docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Vercel Deployment](#vercel-deployment)
7. [Railway/Render Deployment](#railwayrender-deployment)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [Domain Configuration](#domain-configuration)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Monitoring & Logging](#monitoring--logging)
12. [Performance Optimization](#performance-optimization)
13. [Security Checklist](#security-checklist)
14. [Database Backup Strategy](#database-backup-strategy)
15. [Scaling Guide](#scaling-guide)
16. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20+ | Runtime environment |
| npm | 10+ | Package manager |
| PostgreSQL | 16+ | Database |
| Redis | 7+ | Caching & sessions |
| Git | 2.30+ | Version control |
| Docker | 24+ | Containerization (optional) |

### Hardware Requirements

**Development:**
- RAM: 8GB minimum, 16GB recommended
- Storage: 20GB free space
- CPU: 4+ cores

**Production:**
- RAM: 4GB minimum, 8GB+ recommended
- Storage: 50GB+ SSD
- CPU: 2+ vCPUs

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ecommerce-platform.git
cd ecommerce-platform
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 3. Setup Environment Variables

```bash
# Copy example environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit the `.env` files with your configuration (see [Environment Variables Reference](#environment-variables-reference)).

### 4. Setup Database

#### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be healthy
docker-compose ps
```

#### Using Local Services

Ensure PostgreSQL and Redis are running locally and update the connection strings in your `.env` file.

### 5. Run Database Migrations

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npm run seed

cd ..
```

### 6. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually:
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 7. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs

---

## Environment Variables Reference

### Database Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `ecommerce_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Required |
| `POSTGRES_DB` | Database name | `ecommerce_db` |
| `DATABASE_URL` | Full connection string | Required |

### Redis Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_PASSWORD` | Redis password | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### Application Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend port | `3001` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRATION` | Token expiration | `7d` |
| `NEXTAUTH_SECRET` | NextAuth secret | Required |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |

### External Services

| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | Email server host | Yes |
| `SMTP_PORT` | Email server port | Yes |
| `SMTP_USER` | Email username | Yes |
| `SMTP_PASS` | Email password | Yes |
| `STRIPE_SECRET_KEY` | Stripe API key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `AWS_S3_BUCKET` | S3 bucket name | Yes |
| `AWS_REGION` | AWS region | `us-east-1` |

---

## Docker Deployment

### Development with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production with Docker

```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Docker Commands Reference

```bash
# Rebuild a specific service
docker-compose -f docker-compose.prod.yml build backend

# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# View resource usage
docker stats

# Execute commands in containers
docker exec -it ecommerce-backend sh
docker exec -it ecommerce-postgres psql -U ecommerce_user ecommerce_db
```

---

## AWS Deployment

### Architecture Overview

```
                    ┌─────────────┐
                    │   Route 53  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │     ALB     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │  EC2 (1)  │ │EC2 (2)│ │  EC2 (3)  │
        │  Backend  │ │Backend│ │  Backend  │
        └─────┬─────┘ └───┬───┘ └─────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
        ┌─────▼─────┐             ┌─────▼─────┐
        │    RDS    │             │ ElastiCache│
        │ PostgreSQL│             │   Redis    │
        └───────────┘             └───────────┘
```

### Step 1: Setup RDS (PostgreSQL)

```bash
# Using AWS CLI
aws rds create-db-instance \
    --db-instance-identifier ecommerce-db \
    --db-instance-class db.t3.medium \
    --engine postgres \
    --engine-version 16 \
    --master-username ecommerce_user \
    --master-user-password YOUR_SECURE_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp3 \
    --vpc-security-group-ids sg-xxxxx \
    --db-subnet-group-name ecommerce-subnet-group \
    --backup-retention-period 7 \
    --multi-az \
    --storage-encrypted
```

### Step 2: Setup ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
    --cache-cluster-id ecommerce-redis \
    --cache-node-type cache.t3.medium \
    --engine redis \
    --engine-version 7.0 \
    --num-cache-nodes 1 \
    --vpc-security-group-ids sg-xxxxx
```

### Step 3: Setup EC2 Instance

```bash
# Launch EC2 instance
aws ec2 run-instances \
    --image-id ami-xxxxx \
    --instance-type t3.medium \
    --key-name your-key-pair \
    --security-group-ids sg-xxxxx \
    --subnet-id subnet-xxxxx \
    --user-data file://user-data.sh
```

### User Data Script

```bash
#!/bin/bash
yum update -y
amazon-linux-extras install docker
service docker start
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
yum install git -y

# Clone repository
cd /home/ec2-user
git clone https://github.com/yourusername/ecommerce-platform.git
cd ecommerce-platform

# Setup environment
cp .env.example .env
# Edit .env with production values

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Setup S3 Bucket

```bash
# Create S3 bucket for uploads
aws s3 mb s3://ecommerce-uploads --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket ecommerce-uploads \
    --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
    --bucket ecommerce-uploads \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms"
            }
        }]
    }'
```

---

## Vercel Deployment

### Frontend Only

1. **Push to GitHub**

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `frontend` directory

3. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=https://your-domain.com
   ```

4. **Deploy**
   - Vercel will automatically deploy on push to main

### Vercel Configuration

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-api-domain.com/api/:path*"
    }
  ]
}
```

---

## Railway/Render Deployment

### Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - New Project > Deploy from GitHub

2. **Add Services**
   - PostgreSQL plugin
   - Redis plugin

3. **Configure Environment**
   ```
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   JWT_SECRET=your_secret
   ```

4. **Deploy**
   - Railway auto-deploys on push

### Render

1. **Create Web Services**
   - Go to [render.com](https://render.com)
   - New > Web Service

2. **Configure Backend**
   ```
   Build Command: cd backend && npm install && npm run build
   Start Command: cd backend && npm start
   ```

3. **Configure Frontend**
   ```
   Build Command: cd frontend && npm install && npm run build
   Start Command: cd frontend && npm start
   ```

4. **Add PostgreSQL**
   - New > PostgreSQL
   - Connect to your services

---

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Setup

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/privkey.pem \
    -out nginx/ssl/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

---

## Domain Configuration

### DNS Records

```
Type    Name    Value                   TTL
A       @       your-server-ip          300
A       www     your-server-ip          300
CNAME   api     your-api-domain.com     300
CNAME   cdn     your-cdn-domain.com     300
MX      @       mail.yourdomain.com     300
TXT     @       v=spf1 include:...      300
```

### Nginx Domain Configuration

Update `nginx/nginx.conf`:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

---

## CI/CD Pipeline

### GitHub Actions Setup

1. **Add Repository Secrets**
   - `DOCKER_USERNAME`: Docker Hub username
   - `DOCKER_PASSWORD`: Docker Hub password
   - `SERVER_HOST`: Server IP address
   - `SERVER_USER`: SSH username
   - `SERVER_SSH_KEY`: SSH private key
   - `PRODUCTION_URL`: Production URL
   - `PROJECT_PATH`: Path to project on server

2. **Environments**
   - Create `production` environment in GitHub
   - Add deployment protection rules

### Pipeline Stages

```
Push to main → Lint → Type Check → Test → Build → Docker Push → Deploy
```

---

## Monitoring & Logging

### Application Monitoring

```bash
# Health check endpoint
curl http://localhost:3001/health

# Check container health
docker ps
docker inspect --format='{{.State.Health.Status}}' ecommerce-backend
```

### Log Management

```bash
# View container logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# View Nginx logs
docker exec ecommerce-nginx tail -f /var/log/nginx/access.log
docker exec ecommerce-nginx tail -f /var/log/nginx/error.log
```

### Recommended Tools

- **APM:** New Relic, Datadog, or Sentry
- **Monitoring:** Prometheus + Grafana
- **Log Aggregation:** ELK Stack or Loki
- **Uptime:** UptimeRobot or Pingdom

---

## Performance Optimization

### Backend Optimization

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Enable caching
import RedisStore from 'cache-manager-redis-store';
```

### Frontend Optimization

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  experimental: {
    optimizeCss: true,
  },
};
```

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 1;
```

---

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure HTTP headers
- [ ] Implement rate limiting
- [ ] Validate all user inputs
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Implement CORS properly
- [ ] Use JWT with short expiration
- [ ] Hash passwords with bcrypt
- [ ] Implement CSRF protection
- [ ] Sanitize file uploads
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable database encryption
- [ ] Implement audit logging
- [ ] Regular security scans

---

## Database Backup Strategy

### Automated Backups

```bash
# Setup cron job for daily backups
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/ecommerce-platform/scripts/backup.sh backup

# Add weekly cleanup
0 3 * * 0 /path/to/ecommerce-platform/scripts/backup.sh cleanup
```

### Backup Locations

1. **Local:** `./backups/`
2. **S3:** Upload backups to S3
3. **Offsite:** Replicate to another region

### Restore Procedure

```bash
# List backups
./scripts/backup.sh list

# Restore from backup
./scripts/backup.sh restore ./backups/ecommerce_backup_20240101_020000.sql.gz
```

---

## Scaling Guide

### Horizontal Scaling

```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# AWS Auto Scaling
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name ecommerce-backend \
    --min-size 2 \
    --max-size 10 \
    --desired-capacity 3
```

### Database Scaling

```bash
# Read replicas (AWS)
aws rds create-db-instance \
    --db-instance-identifier ecommerce-db-replica \
    --source-db-instance-identifier ecommerce-db \
    --db-instance-class db.t3.medium

# Connection pooling with PgBouncer
docker run -d \
    --name pgbouncer \
    -e DATABASE_URL=postgresql://... \
    -p 6432:6432 \
    edoburu/pgbouncer
```

### Redis Scaling

```bash
# Redis Cluster
redis-cli --cluster create \
    node1:6379 node2:6379 node3:6379 \
    node4:6379 node5:6379 node6:6379 \
    --cluster-replicas 1
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
docker-compose logs postgres

# Test connection
psql -h localhost -U ecommerce_user -d ecommerce_db

# Reset database
docker-compose down -v
docker-compose up -d postgres
npx prisma migrate dev
```

#### 2. Redis Connection Failed

```bash
# Check Redis status
docker-compose logs redis

# Test connection
redis-cli -a your_password ping

# Clear Redis data
docker-compose down -v
docker-compose up -d redis
```

#### 3. Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process
taskkill /PID <process_id> /F
```

#### 4. Build Fails

```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear Docker cache
docker system prune -a
docker-compose build --no-cache
```

#### 5. Memory Issues

```bash
# Check container resources
docker stats

# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory: 8GB
```

### Getting Help

- Check the [GitHub Issues](https://github.com/yourusername/ecommerce-platform/issues)
- Review [API Documentation](http://localhost:3001/api/docs)
- Join our [Discord Community](https://discord.gg/your-invite)

---

## License

This deployment guide is part of the Ecommerce Platform project and is licensed under the MIT License.
