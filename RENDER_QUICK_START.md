# 🚀 BillByteKOT AI - Render Quick Start Guide

Deploy BillByteKOT AI to Render.com in 5 minutes! This guide focuses on the fastest path to get your restaurant management system live.

## 📋 Prerequisites

1. **GitHub Account** with your BillByteKOT AI repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas Account** - Free tier at [mongodb.com/atlas](https://cloud.mongodb.com)

## 🚀 Step 1: Setup Database (2 minutes)

1. **Create MongoDB Atlas Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Click "Build a Database" → Choose "M0 Sandbox" (Free)
   - Select AWS, closest region to you
   - Create cluster (takes 1-2 minutes)

2. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/restrobill`
   - Replace `<password>` with your database password

3. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - Choose "Allow access from anywhere" (0.0.0.0/0)

## 🚀 Step 2: Deploy Backend API (2 minutes)

1. **Create Web Service in Render**
   ```
   Service Type: Web Service
   Repository: your-username/restro-ai
   Branch: main
   Root Directory: backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: python main.py
   ```

2. **Set Environment Variables**
   ```
   ENVIRONMENT=production
   HOST=0.0.0.0
   PORT=10000
   DEBUG=false
   
   # Database (REQUIRED)
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/restrobill
   DB_NAME=restrobill
   
   # Security (REQUIRED)
   JWT_SECRET=your-32-character-secret-key-here
   JWT_ALGORITHM=HS256
   
   # CORS (Update with your frontend URL later)
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   
   # Optional: Payment Gateway
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
   # Optional: AI Features
   LLM_API_KEY=your_openai_api_key
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Note your backend URL: `https://your-backend-name.onrender.com`

## 🚀 Step 3: Deploy Frontend (1 minute)

1. **Create Static Site in Render**
   ```
   Service Type: Static Site
   Repository: your-username/restro-ai
   Branch: main
   Root Directory: frontend
   Build Command: npm install --legacy-peer-deps && npm run build
   Publish Directory: build
   ```

2. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-name.onrender.com/api
   REACT_APP_ENVIRONMENT=production
   CI=false
   
   # Optional: Payment Gateway
   REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

3. **Deploy**
   - Click "Create Static Site"
   - Wait for build (3-5 minutes)
   - Your app will be live at: `https://your-frontend-name.onrender.com`

## 🔧 Step 4: Update CORS Settings

1. **Go back to your Backend service**
2. **Update Environment Variables**
   ```
   CORS_ORIGINS=https://your-frontend-name.onrender.com,https://yourdomain.com
   ```
3. **Redeploy backend service**

## ✅ Verification Checklist

- [ ] Backend API responds at: `https://your-backend.onrender.com/health`
- [ ] Frontend loads at: `https://your-frontend.onrender.com`
- [ ] Database connection working (check backend logs)
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Can create menu items
- [ ] Can create tables
- [ ] Can create orders

## 🔑 Required Environment Variables

### Backend (.env equivalent)
```bash
# Database Connection
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/restrobill
DB_NAME=restrobill

# Security
JWT_SECRET=your-super-secure-32-character-secret
JWT_ALGORITHM=HS256

# Server
ENVIRONMENT=production
HOST=0.0.0.0
PORT=10000
DEBUG=false
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=https://your-frontend.onrender.com
```

### Frontend (.env equivalent)
```bash
# API Connection
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_ENVIRONMENT=production

# Build Settings
CI=false
```

## 🎯 Next Steps

1. **Custom Domain** (Optional)
   - Add your domain in Render dashboard
   - Update DNS settings
   - SSL automatically provided

2. **Payment Gateway** (Optional)
   - Get Razorpay API keys
   - Add to environment variables
   - Test payment flow

3. **AI Features** (Optional)
   - Get OpenAI API key
   - Add `LLM_API_KEY` to backend environment

## 🆘 Troubleshooting

### Build Fails
```bash
# Common fixes:
# 1. Check Node.js version (should be 18+)
# 2. Use legacy peer deps: npm install --legacy-peer-deps
# 3. Set CI=false to treat warnings as warnings
```

### Backend Won't Start
```bash
# Check environment variables:
# 1. MONGO_URL is correctly formatted
# 2. JWT_SECRET is at least 32 characters
# 3. PORT is set to 10000 for Render
```

### CORS Errors
```bash
# Update backend CORS_ORIGINS:
CORS_ORIGINS=https://your-exact-frontend-url.onrender.com
```

### Database Connection Issues
```bash
# MongoDB Atlas checklist:
# 1. Network Access allows 0.0.0.0/0
# 2. Database user has read/write permissions
# 3. Connection string has correct password
# 4. Database name matches (restrobill)
```

## 📞 Support

- **Render Logs**: Check service logs in Render dashboard
- **MongoDB Logs**: Check Atlas monitoring dashboard
- **GitHub Issues**: Create issue with error details

## 💰 Costs

- **Render**: Free tier includes 750 hours/month
- **MongoDB Atlas**: M0 cluster is free forever
- **Total**: $0/month for development and small production use

---

**🍽️ Your BillByteKOT AI is now live!**

Start managing your restaurant with modern technology. Add your first menu items, create tables, and start taking orders!
