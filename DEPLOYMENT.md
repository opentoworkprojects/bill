# 🚀 RestoBill AI - Deployment Guide

Complete guide for deploying RestoBill AI restaurant management system to production.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Deployment Methods](#-deployment-methods)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [Production Deployment](#-production-deployment)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

The fastest way to get RestoBill AI running:

```bash
# Clone the repository
git clone https://github.com/your-username/restro-ai.git
cd restro-ai

# Start with Docker (recommended)
./deploy.sh start

# OR start manually
./start-server.sh
```

## 📦 Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+, CentOS 8+, macOS 10.15+, or Windows 10+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: 10GB+ available space
- **CPU**: 2+ cores recommended

### Software Dependencies

#### For Docker Deployment (Recommended)
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### For Manual Deployment
```bash
# Python 3.11+
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Node.js 18+ (for frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB 6.0+
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

## 🎯 Deployment Methods

### Method 1: Docker Deployment (Recommended)

**Advantages**: Isolated environment, easy scaling, consistent across environments

```bash
# 1. Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# 2. Deploy with single command
./deploy.sh docker

# 3. Access your application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database Admin: http://localhost:8081
```

### Method 2: Manual Deployment

**Advantages**: Direct control, easier debugging, better for development

```bash
# 1. Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# 2. Start MongoDB
sudo systemctl start mongod

# 3. Deploy manually
./deploy.sh manual
```

### Method 3: Cloud Platform Deployment

#### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login and create app
heroku login
heroku create your-restobill-app

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Configure environment variables
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set RAZORPAY_KEY_ID=your_key_id
heroku config:set RAZORPAY_KEY_SECRET=your_key_secret

# Deploy
git push heroku main
```

#### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: restobill-ai
services:
- name: backend
  source_dir: backend
  github:
    repo: your-username/restro-ai
    branch: main
  run_command: python main.py
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: MONGO_URL
    value: ${db.CONNECTION_STRING}
  - key: JWT_SECRET
    type: SECRET
- name: frontend
  source_dir: frontend
  github:
    repo: your-username/restro-ai
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
databases:
- name: restobill-db
  engine: MONGODB
  version: "5"
```

## ⚙️ Configuration

### Environment Variables

Create `backend/.env` file with these configurations:

```env
# Required Configuration
MONGO_URL=mongodb://localhost:27017/restrobill
DB_NAME=restrobill
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_ALGORITHM=HS256

# Server Configuration
HOST=0.0.0.0
PORT=5000
ENVIRONMENT=production
DEBUG=false

# CORS (Frontend URLs)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Payment Gateway (Optional)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# AI/LLM Integration (Optional)
LLM_API_KEY=your_openai_or_llm_api_key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Security
MAX_FILE_SIZE=5242880
RATE_LIMIT_PER_MINUTE=100

# Logging
LOG_LEVEL=INFO
```

### Frontend Configuration

Create `frontend/.env` file:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENVIRONMENT=production
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
```

## 🗄️ Database Setup

### MongoDB Configuration

#### Local MongoDB Setup

```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user
mongosh
use restrobill
db.createUser({
  user: "restobill",
  pwd: "secure_password_here",
  roles: [{ role: "readWrite", db: "restrobill" }]
})
```

#### MongoDB Atlas (Cloud)

1. Sign up at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Add your IP to whitelist
4. Create database user
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/restrobill`

#### Database Indexing (Performance)

```javascript
// Run in MongoDB shell for better performance
use restrobill

// Users collection indexes
db.users.createIndex({ "username": 1 })
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "organization_id": 1 })

// Orders collection indexes
db.orders.createIndex({ "organization_id": 1, "created_at": -1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "table_id": 1 })

// Menu items indexes
db.menu_items.createIndex({ "organization_id": 1, "category": 1 })
db.menu_items.createIndex({ "available": 1 })

// Payments indexes
db.payments.createIndex({ "organization_id": 1, "created_at": -1 })
db.payments.createIndex({ "status": 1 })
```

## 🏢 Production Deployment

### AWS EC2 Deployment

```bash
# 1. Launch EC2 instance (Ubuntu 20.04, t3.small or larger)
# 2. Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# 3. Update system
sudo apt update && sudo apt upgrade -y

# 4. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 5. Clone and deploy
git clone https://github.com/your-username/restro-ai.git
cd restro-ai
./deploy.sh start

# 6. Setup reverse proxy (Nginx)
sudo apt install nginx
sudo nano /etc/nginx/sites-available/restobill

# Nginx configuration
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/restobill /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL/HTTPS Setup with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (optional)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker Production Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    networks:
      - backend

  backend:
    build: ./backend
    restart: always
    depends_on:
      - mongodb
    environment:
      MONGO_URL: mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongodb:27017/restrobill?authSource=admin
    networks:
      - backend
      - frontend

  frontend:
    build: ./frontend
    restart: always
    depends_on:
      - backend
    networks:
      - frontend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - backend
      - frontend
    networks:
      - frontend

volumes:
  mongodb_data:

networks:
  backend:
  frontend:
```

## 📊 Monitoring & Maintenance

### Health Monitoring

```bash
# Check service health
curl http://localhost:5000/health

# Monitor logs
./deploy.sh logs

# Check resource usage
docker stats

# Database monitoring
mongosh --eval "db.stats()"
```

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Database backup
mongodump --host localhost:27017 --db restrobill --out $BACKUP_DIR/

# File backup
tar -czf $BACKUP_DIR/uploads.tar.gz backend/uploads/

# Keep only last 30 days of backups
find /backups -type d -mtime +30 -exec rm -rf {} +
```

### Performance Optimization

```bash
# MongoDB optimization
# Add to /etc/mongod.conf
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1
    collectionConfig:
      blockCompressor: snappy

# Backend optimization
# Set in .env
UVICORN_WORKERS=4
UVICORN_MAX_WORKERS=8

# Frontend optimization (build)
npm run build
# Serve static files with nginx for better performance
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find and kill process using port
sudo lsof -i :5000
sudo kill -9 <PID>

# Or use different port
export PORT=5001
```

#### 2. Database Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connectivity
mongosh --host localhost:27017

# Reset MongoDB
sudo systemctl restart mongod
```

#### 3. Frontend Build Issues
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

#### 4. Docker Issues
```bash
# Restart Docker
sudo systemctl restart docker

# Clean up Docker
docker system prune -a
docker-compose down
docker-compose up --build

# Check logs
docker-compose logs -f
```

### Log Locations

- **Docker logs**: `docker-compose logs [service]`
- **Backend logs**: `backend/logs/app.log`
- **Frontend logs**: Browser console
- **MongoDB logs**: `/var/log/mongodb/mongod.log`
- **Nginx logs**: `/var/log/nginx/access.log`

### Performance Issues

```bash
# Check system resources
htop
df -h
free -m

# MongoDB performance
mongosh --eval "db.currentOp()"
mongosh --eval "db.serverStatus()"

# Backend performance
pip install py-spy
py-spy record -o profile.svg -d 60 -p <backend-pid>
```

## 🔐 Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable firewall (only open necessary ports)
- [ ] Setup SSL/HTTPS
- [ ] Regular security updates
- [ ] MongoDB authentication enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] File upload restrictions in place
- [ ] Regular backups configured

## 📞 Support

Need help? Here are your options:

1. **Documentation**: Check this guide thoroughly
2. **Logs**: Always check logs first (`./deploy.sh logs`)
3. **GitHub Issues**: Create an issue with detailed error information
4. **Community**: Join our Discord/Telegram for community support

## 🚀 Scaling

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    ports:
      - "5000-5002:5000"

  nginx:
    # Configure load balancing
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration

```nginx
upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

server {
    listen 80;
    location /api/ {
        proxy_pass http://backend;
    }
}
```

---

**🍽️ RestoBill AI** - Smart Restaurant Management Made Simple

For updates and support, visit: [https://github.com/your-username/restro-ai](https://github.com/your-username/restro-ai)