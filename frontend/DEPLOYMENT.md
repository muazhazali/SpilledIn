# 🚀 SpilledIn Deployment Guide

This guide covers deploying the SpilledIn frontend application using Docker, both locally and on a VPS.

## 📋 Prerequisites

- Docker installed on your system
- Docker Compose (optional but recommended)
- Environment variables configured
- Supabase project set up

## 🏠 Local Docker Deployment

### Step 1: Prepare Environment Variables

Create a `.env.production` file in the `frontend/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NODE_ENV=production
```

### Step 2: Build the Docker Image

```bash
cd frontend
docker build -t spilledin-frontend .
```

### Step 3: Run the Container

```bash
docker run --env-file .env.production --name spilledin_frontend -p 3000:3000 spilledin-frontend
```

### Step 4: Access the Application

Open your browser and navigate to: `http://localhost:3000`

### Alternative: Using Docker Compose

Create a `docker-compose.yml` file in the `frontend/` directory:

```yaml
version: '3.8'

services:
  spilledin-frontend:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    container_name: spilledin_frontend
```

Then run:

```bash
docker-compose up -d
```

## 🌐 VPS Deployment

### Prerequisites for VPS

- Ubuntu/Debian VPS with root access
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

### Step 1: Server Setup

Connect to your VPS and update the system:

```bash
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Start Docker service
systemctl start docker
systemctl enable docker
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/yourusername/SpilledIn.git
cd SpilledIn/frontend
```

### Step 3: Configure Environment

```bash
# Create production environment file
nano .env.production
```

Add your production environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NODE_ENV=production
```

### Step 4: Build and Deploy

```bash
# Build the image
docker build -t spilledin-frontend .

# Run the container
docker run -d \
  --name spilledin_frontend \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  spilledin-frontend
```

### Step 5: Set Up Reverse Proxy (Nginx)

Install and configure Nginx as a reverse proxy:

```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/spilledin
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
# Enable the site
ln -s /etc/nginx/sites-available/spilledin /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 6: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
certbot renew --dry-run
```

## 🔧 Production Docker Compose Setup

For a more robust VPS deployment, create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  spilledin-frontend:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped
    container_name: spilledin_frontend
    networks:
      - spilledin-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  spilledin-network:
    driver: bridge
```

Deploy with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Monitoring and Maintenance

### Check Container Status

```bash
# View running containers
docker ps

# Check container logs
docker logs spilledin_frontend

# Follow logs in real-time
docker logs -f spilledin_frontend
```

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild image
docker build -t spilledin-frontend .

# Stop and remove old container
docker stop spilledin_frontend
docker rm spilledin_frontend

# Run new container
docker run -d \
  --name spilledin_frontend \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  spilledin-frontend
```

### Backup and Restore

```bash
# Create image backup
docker save spilledin-frontend > spilledin-backup.tar

# Restore from backup
docker load < spilledin-backup.tar
```

## 🛡️ Security Considerations

### Firewall Configuration

```bash
# Install UFW
apt install ufw -y

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### Container Security

- Run containers as non-root user (already configured in Dockerfile)
- Keep Docker and system updated
- Use specific image tags instead of `latest`
- Regularly scan images for vulnerabilities

### Environment Variables Security

- Never commit `.env.production` to version control
- Use Docker secrets for sensitive data in production
- Rotate API keys regularly

## 🚨 Troubleshooting

### Common Issues

1. **Container won't start**:
   ```bash
   docker logs spilledin_frontend
   ```

2. **Port already in use**:
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process or use different port
   ```

3. **Environment variables not loading**:
   - Check `.env.production` file exists
   - Verify file permissions
   - Ensure no extra spaces in variable definitions

4. **Nginx 502 Bad Gateway**:
   - Check if container is running: `docker ps`
   - Verify port mapping is correct
   - Check Nginx configuration: `nginx -t`

### Performance Optimization

1. **Enable Gzip in Nginx**:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   ```

2. **Set up caching**:
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## 📊 Monitoring Setup

### Basic Health Check

Create a simple health check endpoint monitoring:

```bash
# Create monitoring script
nano /opt/spilledin-monitor.sh
```

```bash
#!/bin/bash
if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "SpilledIn is down, restarting container..."
    docker restart spilledin_frontend
fi
```

```bash
# Make executable
chmod +x /opt/spilledin-monitor.sh

# Add to crontab (check every 5 minutes)
crontab -e
# Add: */5 * * * * /opt/spilledin-monitor.sh
```

## 🎯 Next Steps

After successful deployment:

1. Set up automated backups
2. Configure monitoring and alerting
3. Set up CI/CD pipeline for automated deployments
4. Consider using container orchestration (Docker Swarm/Kubernetes) for scaling

---

**Your SpilledIn application is now ready for production! 🎉** 