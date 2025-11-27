# RestoBill AI Frontend - Environment Setup Summary

## 📋 Overview

This document provides a comprehensive summary of the frontend environment configuration for RestoBill AI. The React application requires proper environment variable setup for API connections, payment gateways, external services, and feature flags.

## 🗂️ Environment Files Created

### Core Environment Files
- ✅ `.env` - Default fallback configuration
- ✅ `.env.development` - Development environment settings
- ✅ `.env.production` - Production deployment configuration
- ✅ `.env.staging` - Staging/testing environment
- ✅ `.env.local.template` - Template for local development setup

### Supporting Files
- ✅ `scripts/validate-env.js` - Environment validation script
- ✅ `FRONTEND_ENV_SETUP.md` - Detailed setup documentation
- ✅ `README.md` - Updated with environment information

## 🚀 Quick Setup Guide

### Step 1: Copy Environment Template
```bash
cd frontend
cp .env.local.template .env.local
```

### Step 2: Configure Essential Variables
Edit `.env.local` with your actual values:

```bash
# Backend Connection (Required)
REACT_APP_BACKEND_URL=http://localhost:5000

# Payment Gateway (Highly Recommended)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_actual_key_here
REACT_APP_RAZORPAY_ENABLED=true

# Google Maps API (Optional but Recommended)
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Step 3: Validate Configuration
```bash
# Validate environment setup
npm run validate-env

# Get setup guidance
npm run validate-env:guide

# Start development server
npm start
```

## 🔧 Environment Variables by Category

### 🎯 Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|--------|
| `REACT_APP_BACKEND_URL` | Backend API server URL | `http://localhost:5000` | No trailing slash |

### ⚡ Important Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|--------|
| `REACT_APP_RAZORPAY_KEY_ID` | Razorpay payment key | `rzp_test_xxxxxxxxxx` | Required for payments |
| `REACT_APP_ENVIRONMENT` | Application environment | `development` | Affects logging/features |

### 🌟 Optional Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|--------|
| `REACT_APP_GOOGLE_MAPS_API_KEY` | Google Maps API key | `AIzaSyxxxxxxxxxx` | For location features |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` | For notifications |
| `REACT_APP_GA_TRACKING_ID` | Google Analytics ID | `GA-XXXXXXXXX-X` | For analytics |
| `REACT_APP_SENTRY_DSN` | Sentry error tracking | `https://xxx@sentry.io/project` | For error monitoring |

### ⚙️ Build Tools Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|--------|
| `PORT` | Development server port | `3000` | Optional override |
| `GENERATE_SOURCEMAP` | Enable source maps | `true` | `false` in production |
| `SKIP_PREFLIGHT_CHECK` | Skip CRA preflight | `true` | Recommended |

## 🏗️ Environment Configurations by Deployment

### Local Development
```bash
# File: .env.local
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
REACT_APP_GOOGLE_MAPS_API_KEY=your_dev_api_key
```

### Staging Environment
```bash
# File: .env.staging
REACT_APP_BACKEND_URL=https://your-backend-staging.onrender.com
REACT_APP_ENVIRONMENT=staging
REACT_APP_DEBUG=true
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

### Production Environment
```bash
# File: .env.production
REACT_APP_BACKEND_URL=https://your-backend-prod.onrender.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
GENERATE_SOURCEMAP=false
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
```

## 🎚️ Feature Flags Configuration

Control application features through environment variables:

```bash
# Core Features
REACT_APP_FEATURE_AI_RECOMMENDATIONS=true
REACT_APP_FEATURE_ANALYTICS=true
REACT_APP_FEATURE_INVENTORY=true
REACT_APP_FEATURE_STAFF_MANAGEMENT=true
REACT_APP_FEATURE_KITCHEN_DISPLAY=true

# Customer Features  
REACT_APP_FEATURE_QR_ORDERING=true
REACT_APP_FEATURE_LOYALTY_PROGRAM=true

# Advanced Features
REACT_APP_FEATURE_VOICE_ORDERS=false
REACT_APP_FEATURE_MULTI_LOCATION=true
```

## 🔐 API Keys Setup Guide

### Razorpay Payment Gateway
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** > **API Keys**
3. Generate test keys for development
4. Use live keys for production
5. Set `REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx`

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Maps JavaScript API**
4. Create credentials (API key)
5. Restrict key to your domains
6. Set `REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here`

### Firebase (Optional)
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app
4. Copy configuration values:
   - `REACT_APP_FIREBASE_PROJECT_ID`
   - `REACT_APP_FIREBASE_API_KEY`
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
   - `REACT_APP_FIREBASE_APP_ID`

## 📦 NPM Scripts Added

New scripts added to `package.json`:

```json
{
  "scripts": {
    "validate-env": "node scripts/validate-env.js",
    "validate-env:guide": "node scripts/validate-env.js --guide", 
    "env:setup": "cp .env.local.template .env.local",
    "prestart": "node scripts/validate-env.js --summary"
  }
}
```

### Script Usage
```bash
# Validate current environment
npm run validate-env

# Get setup guidance
npm run validate-env:guide

# Create .env.local from template
npm run env:setup

# Start with automatic validation
npm start
```

## 🔍 Environment Validation Features

The `validate-env.js` script provides:

- ✅ **Required Variable Checking**: Ensures essential variables are set
- ⚠️ **Format Validation**: Validates API key formats and URL structures
- 📋 **Missing Variable Reporting**: Lists missing optional variables
- 🎯 **Environment-Specific Guidance**: Provides setup instructions
- 🚨 **Error Prevention**: Catches common configuration mistakes

### Validation Categories
- **Required**: Must be set for app to function
- **Important**: Highly recommended for full functionality
- **Optional**: Nice-to-have features
- **Build Tools**: Development server configuration

## 🌍 Deployment Platform Configuration

### Render Deployment
Set these environment variables in Render dashboard:
```bash
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_key
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### Vercel Deployment
```bash
REACT_APP_BACKEND_URL=https://your-backend.com
REACT_APP_VERCEL_URL=$VERCEL_URL
```

### Netlify Deployment
```bash
REACT_APP_BACKEND_URL=https://your-backend.com
REACT_APP_NETLIFY_SITE_URL=$DEPLOY_PRIME_URL
```

## 🛡️ Security Best Practices

### Environment Variable Security
- ✅ Use `.env.local` for sensitive local development data
- ✅ Never commit API keys to version control
- ✅ Use test keys in development, live keys in production
- ✅ Restrict API keys to specific domains/IPs
- ✅ Rotate keys regularly

### Variable Naming Conventions
```bash
# ✅ Correct - Available in React app
REACT_APP_API_KEY=your_key_here
REACT_APP_FEATURE_FLAG=true

# ❌ Incorrect - Not available in React app
API_KEY=your_key_here
FEATURE_FLAG=true
```

### Sensitive Data Handling
**Remember**: All `REACT_APP_*` variables are publicly accessible in the browser bundle.

❌ **Never put these in REACT_APP_ variables:**
- Database passwords
- API secrets
- Private keys
- Internal service tokens

✅ **Safe for REACT_APP_ variables:**
- Public API keys (with domain restrictions)
- Feature flags
- Public configuration
- Frontend-specific settings

## 🔧 Troubleshooting Common Issues

### Backend Connection Failed
```bash
# Problem: Cannot connect to backend
# Solution: Check backend URL format
REACT_APP_BACKEND_URL=http://localhost:5000  # ✅ Correct
REACT_APP_BACKEND_URL=http://localhost:5000/ # ❌ Wrong (trailing slash)

# Verify backend is running
curl http://localhost:5000/api/health
```

### Environment Variables Not Loading
```bash
# Problem: Variables show as undefined
# Solution: Ensure proper prefix and restart server

# ✅ Correct - Available in React
REACT_APP_API_URL=http://localhost:5000

# ❌ Wrong - Not available in React  
API_URL=http://localhost:5000

# Restart development server after changes
npm start
```

### Payment Integration Issues
```bash
# Problem: Payments not working
# Solution: Check key format and enable flag

# Test environment
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
REACT_APP_RAZORPAY_ENABLED=true

# Production environment  
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
REACT_APP_RAZORPAY_ENABLED=true
```

### Build Failures
```bash
# Problem: Build fails
# Solution: Clear cache and check Node version

npm run clean-install
node --version  # Should be 18+
npm update
```

## 📊 Environment File Priority

React loads environment files in this order (highest to lowest priority):

1. `.env.local` (highest priority, gitignored)
2. `.env.development` (when NODE_ENV=development)
3. `.env.production` (when NODE_ENV=production) 
4. `.env.staging` (when NODE_ENV=staging)
5. `.env` (default fallback, lowest priority)

## 🧪 Testing Environment Setup

### Test Current Configuration
```javascript
// Add to src/index.js temporarily (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Test:', {
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
    RAZORPAY_ENABLED: process.env.REACT_APP_RAZORPAY_ENABLED,
    NODE_ENV: process.env.NODE_ENV
  });
}
```

### Validation Commands
```bash
# Full validation with detailed output
npm run validate-env

# Quick validation summary  
npm run validate-env -- --summary

# Setup guidance only
npm run validate-env:guide

# Create local environment file
npm run env:setup
```

## 📈 Performance Considerations

### Development Settings
```bash
# Enable for faster development
FAST_REFRESH=true
REACT_APP_HMR=true
SKIP_PREFLIGHT_CHECK=true
GENERATE_SOURCEMAP=true
```

### Production Optimizations
```bash
# Disable for better performance
GENERATE_SOURCEMAP=false
REACT_APP_CONSOLE_LOGGING=false
REACT_APP_DEBUG=false
REACT_APP_REACT_DEVTOOLS=false
```

## ✅ Setup Checklist

### Initial Setup
- [ ] Copy `.env.local.template` to `.env.local`
- [ ] Set `REACT_APP_BACKEND_URL` for your backend
- [ ] Get Razorpay test keys and set `REACT_APP_RAZORPAY_KEY_ID`
- [ ] Get Google Maps API key (optional)
- [ ] Run `npm run validate-env` to check setup
- [ ] Start development server with `npm start`

### Production Deployment  
- [ ] Set production backend URL
- [ ] Use live payment keys (rzp_live_...)
- [ ] Configure production Firebase project
- [ ] Set up production analytics (GA, Sentry)
- [ ] Disable debug features
- [ ] Enable production optimizations
- [ ] Test all integrations thoroughly

### Security Review
- [ ] Verify no sensitive data in REACT_APP_ variables
- [ ] Confirm API keys have proper domain restrictions
- [ ] Check that .env.local is gitignored
- [ ] Ensure production keys are not in development
- [ ] Validate CORS settings with backend

## 📚 Additional Resources

- **Detailed Setup**: See `FRONTEND_ENV_SETUP.md` for comprehensive guide
- **React Docs**: [Environment Variables in Create React App](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- **Razorpay Integration**: [Payment Gateway Documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- **Google Maps API**: [JavaScript API Guide](https://developers.google.com/maps/documentation/javascript/overview)
- **Firebase Setup**: [Web App Setup Guide](https://firebase.google.com/docs/web/setup)

## 🆘 Getting Help

### Validation Issues
```bash
# Get validation help
npm run validate-env:guide

# Check specific variable format
npm run validate-env -- --verbose
```

### Common Debug Commands
```bash
# Check environment loading
node -e "console.log(process.env)" | grep REACT_APP

# Verify backend connectivity  
curl http://localhost:5000/api/health

# Test build process
npm run build
```

### Support Channels
- **Environment Issues**: Run validation script for guidance
- **API Integration**: Check respective service documentation
- **Build Problems**: See troubleshooting section in README
- **General Questions**: Create GitHub issue with environment details

---

## 📋 Summary

The RestoBill AI frontend environment setup provides:

✅ **Complete Environment Configuration**: Development, staging, and production ready  
✅ **Automated Validation**: Scripts to verify setup and catch errors  
✅ **Security Best Practices**: Safe handling of API keys and sensitive data  
✅ **Comprehensive Documentation**: Detailed guides for every aspect  
✅ **Developer Experience**: Easy setup with templates and validation  
✅ **Production Ready**: Optimized configurations for deployment  

**Quick Start**: `cp .env.local.template .env.local` → Edit values → `npm start`

**Status**: ✅ Ready for development and deployment

---

*Last Updated: November 27, 2024*  
*Version: 1.0.0*  
*Environment Setup: Complete* ✅