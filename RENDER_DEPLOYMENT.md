# 🚀 RestoBill AI - Render Deployment Guide

Complete guide for deploying RestoBill AI to Render.com - the fastest and easiest way to deploy your restaurant management system.

## 📋 Table of Contents

- [Why Render?](#-why-render)
- [Prerequisites](#-prerequisites)
- [Quick Deployment](#-quick-deployment)
- [Step-by-Step Deployment](#-step-by-step-deployment)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [Domain & SSL](#-domain--ssl)
- [Monitoring & Logs](#-monitoring--logs)
- [Troubleshooting](#-troubleshooting)
- [Scaling & Performance](#-scaling--performance)

## 🌟 Why Render?

- ✅ **Zero DevOps**: No server management required
- ✅ **Auto Scaling**: Handles traffic spikes automatically
- ✅ **Free SSL**: HTTPS enabled by default
- ✅ **Git Integration**: Deploy on every push
- ✅ **Built-in Database**: Managed MongoDB included
- ✅ **Global CDN**: Fast worldwide delivery
- ✅ **Free Tier**: Start at $0/month

## 📦 Prerequisites

1. **GitHub Account** - Your code should be on GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Domain** (Optional) - For custom branding

## 🚀 Quick Deployment

### Option 1: One-Click Deploy (Recommended)

1. **Fork the Repository**
   ```bash
   # Go to GitHub and fork the repository
   https://github.com/your-username/restro-ai
   ```

2. **Deploy to Render**
   - Click this button: [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/your-username/restro-ai)
   - Or manually create services (see below)

### Option 2: Manual Setup

1. **Sign up/Login to Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account

2. **Create Services**
   - Backend API Service
   - Frontend Web Service
   - MongoDB Database

## 📝 Step-by-Step Deployment

### Step 1: Create MongoDB Database

1. **Go to Render Dashboard**
   - Click "New" → "PostgreSQL" → "MongoDB" (if available)
   - Or use MongoDB Atlas (recommended)

2. **MongoDB Atlas Setup** (Recommended)
   ```bash
   # Sign up at https://cloud.mongodb.com
   # Create new cluster (free tier available)
   # Get connection string:
   mongodb+srv://username:password@cluster.mongodb.net/restrobill
   ```

### Step 2: Deploy Backend API

1. **Create Web Service**
   ```
   Service Type: Web Service
   Repository: your-username/restro-ai
   Branch: main
   Root Directory: backend
   Environment: Python 3.11
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   ```

2. **Environment Variables**
   ```env
   ENVIRONMENT=production
   HOST=0.0.0.0
   PORT=10000
   DEBUG=false
   LOG_LEVEL=INFO
   
   # Database
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/restrobill
   DB_NAME=restrobill
   
   # Security
   JWT_SECRET=your-super-secret-32-character-key
   JWT_ALGORITHM=HS256
   
   # CORS (update with your frontend URL)
   CORS_ORIGINS=https://your-frontend.onrender.com,https://yourdomain.com
   
   # Optional: Payment Gateway
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key
   
   # Optional: AI Features
   LLM_API_KEY=your_openai_key
   
   # File Upload
   MAX_FILE_SIZE=5242880
   RATE_LIMIT_PER_MINUTE=100
   ```

3. **Advanced Settings**
   ```
   Instance Type: Starter (free tier) or higher
   Auto-Deploy: Yes
   Health Check Path: /health
   ```

### Step 3: Deploy Frontend

1. **Create Static Site**
   ```
   Service Type: Static Site
   Repository: your-username/restro-ai
   Branch: main
   Root Directory: frontend
   Build Command: npm install --legacy-peer-deps && npm run build
   Publish Directory: build
   ```

2. **Environment Variables**
   ```env
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   REACT_APP_ENVIRONMENT=production
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxx
   ```

3. **Build Settings**
   ```bash
   # Custom build command if needed
   npm install --legacy-peer-deps && npm run build
   
   # Node version (create .nvmrc in frontend/)
   echo "18" > frontend/.nvmrc
   ```

## ⚙️ Environment Configuration

### Backend Environment Variables (.env)

```env
# ===================
# REQUIRED SETTINGS
# ===================

# Database Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/restrobill
DB_NAME=restrobill

# JWT Security
JWT_SECRET=your-super-secure-32-character-secret-key-here
JWT_ALGORITHM=HS256

# Server Configuration
ENVIRONMENT=production
HOST=0.0.0.0
PORT=10000
DEBUG=false
LOG_LEVEL=INFO

# CORS Configuration
CORS_ORIGINS=https://your-frontend.onrender.com,https://yourdomain.com

# ===================
# OPTIONAL SETTINGS
# ===================

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# AI/LLM Integration
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# File Upload & Security
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/
RATE_LIMIT_PER_MINUTE=100

# Logging
LOG_FILE_PATH=logs/app.log
```

### Frontend Environment Variables

```env
# API Configuration
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_ENVIRONMENT=production

# Payment Integration
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx

# Feature Flags (Optional)
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_PWA=true

# Branding (Optional)
REACT_APP_APP_NAME=RestoBill AI
REACT_APP_COMPANY_NAME=Your Restaurant
```

## 🗄️ Database Setup

### Option 1: MongoDB Atlas (Recommended)

1. **Sign up at MongoDB Atlas**
   ```
   https://cloud.mongodb.com/
   ```

2. **Create Cluster**
   ```
   Provider: AWS/Google Cloud/Azure
   Region: Choose closest to your users
   Tier: M0 Sandbox (Free) or higher
   ```

3. **Configure Database**
   ```bash
   # Database Name: restrobill
   # Username: restobill_user
   # Password: Generate secure password
   
   # Get connection string:
   mongodb+srv://restobill_user:password@cluster.mongodb.net/restrobill
   ```

4. **Network Access**
   ```
   Add IP Address: 0.0.0.0/0 (Allow from anywhere)
   Or add Render's IP ranges (more secure)
   ```

### Option 2: Render PostgreSQL (Alternative)

If you prefer PostgreSQL over MongoDB:

```python
# Update backend dependencies
pip install psycopg2-binary sqlalchemy

# Update database configuration
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### Database Indexing for Performance

```javascript
// Run these MongoDB commands for better performance
use restrobill

// Users collection
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "organization_id": 1 })

// Orders collection
db.orders.createIndex({ "organization_id": 1, "created_at": -1 })
db.orders.createIndex({ "status": 1 })
db.orders.createIndex({ "table_id": 1 })

// Menu items
db.menu_items.createIndex({ "organization_id": 1, "category": 1 })
db.menu_items.createIndex({ "available": 1 })

// Payments
db.payments.createIndex({ "organization_id": 1, "created_at": -1 })
db.payments.createIndex({ "status": 1 })
```

## 🌐 Domain & SSL

### Custom Domain Setup

1. **Add Custom Domain in Render**
   ```
   Service Settings → Custom Domains
   Add Domain: yourdomain.com
   Add Domain: www.yourdomain.com
   ```

2. **Update DNS Records**
   ```dns
   Type: CNAME
   Name: www
   Value: your-app.onrender.com

   Type: A
   Name: @
   Value: 216.24.57.1 (Render's IP)
   ```

3. **Update Environment Variables**
   ```env
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

### SSL Certificate

- **Automatic**: Render provides free SSL certificates
- **Custom SSL**: Upload your own certificate if needed

## 📊 Monitoring & Logs

### Health Checks

Render automatically monitors your services:

```python
# Health check endpoint (already included)
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}
```

### Viewing Logs

1. **Render Dashboard**
   ```
   Go to your service → Logs tab
   Real-time log streaming available
   ```

2. **Log Management**
   ```python
   # Logs are automatically collected
   # Configure log levels in environment:
   LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
   ```

### Monitoring Tools

```bash
# Add monitoring endpoints
GET /health          # Basic health check
GET /api/health      # API health check
GET /metrics         # Application metrics (if implemented)
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Build Failures

**Frontend Build Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Update package.json build script
"scripts": {
  "build": "CI=false npm run build"
}

# Fix dependency conflicts
npm install --legacy-peer-deps
```

**Backend Build Issues:**
```bash
# Check Python version
python --version  # Should be 3.11+

# Update requirements.txt
pip freeze > requirements.txt

# Fix import issues
export PYTHONPATH=/app
```

#### 2. Database Connection Issues

```env
# Check connection string format
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Verify credentials
# Check network access in MongoDB Atlas
# Ensure IP whitelist includes 0.0.0.0/0 or Render IPs
```

#### 3. CORS Issues

```env
# Update CORS origins
CORS_ORIGINS=https://your-frontend.onrender.com,https://yourdomain.com

# Check exact URL format (no trailing slash)
```

#### 4. Environment Variable Issues

```bash
# Check variable names (case sensitive)
# Verify values are properly set
# Restart service after changes
```

### Debug Mode

Enable debug mode for development:

```env
DEBUG=true
LOG_LEVEL=DEBUG
```

### Service Restart

```bash
# Force restart service
# Go to Render Dashboard → Your Service → Manual Deploy
```

## 🚀 Scaling & Performance

### Instance Types

```
Starter (Free):     512MB RAM, 0.1 CPU
Standard:          1GB RAM, 0.5 CPU
Pro:               2GB RAM, 1 CPU
Pro Plus:          4GB RAM, 2 CPU
```

### Auto-Scaling

Render automatically scales based on:
- CPU usage
- Memory usage
- Request rate
- Response time

### Performance Optimization

#### Backend Optimization

```python
# Add to your environment
UVICORN_WORKERS=1  # Start with 1, increase as needed
UVICORN_WORKER_CONNECTIONS=1000

# Enable caching
REDIS_URL=redis://your-redis-instance
```

#### Frontend Optimization

```javascript
// Enable compression in nginx.conf
gzip on;
gzip_types text/plain application/javascript text/css;

// Optimize build
npm run build -- --production
```

#### Database Optimization

```javascript
// Add database indexes (see Database Setup section)
// Monitor query performance in MongoDB Atlas
// Use connection pooling
```

### CDN & Caching

```nginx
# Static assets caching (already in nginx.conf)
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 💰 Pricing

### Free Tier Limits

- **Static Sites**: Free forever
- **Web Services**: 750 hours/month free
- **Databases**: 90 days free, then paid

### Paid Plans

- **Starter**: $7/month per service
- **Standard**: $25/month per service
- **Pro**: $85/month per service

## 🔐 Security Best Practices

### Environment Variables

```env
# Never commit these to Git
JWT_SECRET=use-strong-random-string
RAZORPAY_KEY_SECRET=keep-this-secret
MONGO_URL=include-strong-password

# Use Render's built-in secret management
```

### Network Security

```
✅ HTTPS enabled by default
✅ DDoS protection included
✅ Private networking between services
✅ Automatic security updates
```

### Application Security

```python
# Rate limiting (already implemented)
RATE_LIMIT_PER_MINUTE=100

# File upload restrictions
MAX_FILE_SIZE=5242880

# CORS configuration
CORS_ORIGINS=https://yourdomain.com
```

## 🎯 Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL certificate ready
- [ ] Custom domain configured
- [ ] Payment gateway tested
- [ ] Email service configured

### Post-Deployment

- [ ] Health checks passing
- [ ] Frontend loading correctly
- [ ] API endpoints working
- [ ] Database operations successful
- [ ] File uploads working
- [ ] Authentication flow tested
- [ ] Payment processing tested

### Monitoring Setup

- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Backup strategy implemented
- [ ] Alert notifications configured

## 📞 Support & Resources

### Render Documentation

- [Render Docs](https://render.com/docs)
- [Deploy Node.js](https://render.com/docs/deploy-node-express-app)
- [Deploy Python](https://render.com/docs/deploy-fastapi)
- [Static Sites](https://render.com/docs/deploy-create-react-app)

### RestoBill AI Support

- 📧 Email: support@restobill.ai
- 💬 GitHub Issues: [Create Issue](https://github.com/your-username/restro-ai/issues)
- 📚 Documentation: See main README.md
- 🌐 Website: https://restobill.ai

## 🎉 Success!

Your RestoBill AI is now live on Render! 🍽️

**Access Your Application:**
- Frontend: `https://your-frontend.onrender.com`
- Backend API: `https://your-backend.onrender.com`
- API Docs: `https://your-backend.onrender.com/docs`

**Next Steps:**
1. Set up your restaurant profile
2. Add menu items and tables
3. Configure payment gateway
4. Train your staff on the system
5. Start taking orders!

---

**RestoBill AI** - Smart Restaurant Management Made Simple

*Deployed with ❤️ on Render*