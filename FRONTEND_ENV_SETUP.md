# RestoBill AI Frontend - Environment Setup Guide

## Overview

This guide covers the complete setup of environment variables for the RestoBill AI frontend React application. The frontend uses various external services and APIs that require proper configuration through environment variables.

## Environment Files Structure

The frontend uses different environment files for different deployment scenarios:

```
frontend/
├── .env.development      # Development environment (committed)
├── .env.production       # Production environment (committed)
├── .env.staging          # Staging environment (committed)
├── .env.local.template   # Local development template (committed)
├── .env.local            # Your local overrides (gitignored)
└── .env                  # Fallback environment (if needed)
```

## Quick Start

### 1. Copy Local Environment Template

```bash
cd frontend
cp .env.local.template .env.local
```

### 2. Edit Your Local Configuration

Open `.env.local` and update these essential variables:

```bash
# Backend connection
REACT_APP_BACKEND_URL=http://localhost:5000

# Payment gateway (get from Razorpay dashboard)
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_actual_key_here

# Google Maps (get from Google Cloud Console)
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_google_maps_key_here
```

### 3. Start Development

```bash
npm start
```

## Core Environment Variables

### Backend API Configuration

```bash
# Required: Backend server URL
REACT_APP_BACKEND_URL=http://localhost:5000

# Automatically constructed API base URL
REACT_APP_API_BASE_URL=${REACT_APP_BACKEND_URL}/api
```

**Values by Environment:**
- **Development**: `http://localhost:5000`
- **Staging**: `https://your-backend-staging.onrender.com`
- **Production**: `https://your-backend-prod.onrender.com`

### Payment Gateway Configuration

#### Razorpay (Primary Payment Gateway)

```bash
# Enable Razorpay payments
REACT_APP_RAZORPAY_ENABLED=true

# Razorpay Key ID
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

**How to Get Razorpay Keys:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** > **API Keys**
3. Generate test keys for development
4. Use live keys for production

**Key Formats:**
- **Test**: `rzp_test_xxxxxxxxxx`
- **Live**: `rzp_live_xxxxxxxxxx`

#### Stripe (Alternative Payment Gateway)

```bash
# Enable Stripe payments (optional)
REACT_APP_STRIPE_ENABLED=false
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
```

### External Service APIs

#### Google Maps API

```bash
# Required for location features
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**How to Get Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Maps JavaScript API**
4. Go to **Credentials** > **Create Credentials** > **API Key**
5. Restrict the API key to your domains (recommended)

#### Firebase (Push Notifications)

```bash
# Firebase configuration (optional)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**How to Set Up Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a web app to your project
4. Copy the config values from the setup wizard

## Environment-Specific Configurations

### Development Environment

**File**: `.env.development`

```bash
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug

# Development features enabled
REACT_APP_ENABLE_REDUX_DEVTOOLS=true
REACT_APP_CONSOLE_LOGGING=true
REACT_APP_PERFORMANCE_MONITORING=true

# Permissive CORS for local development
REACT_APP_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### Production Environment

**File**: `.env.production`

```bash
REACT_APP_BACKEND_URL=https://your-backend-prod.onrender.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error

# Production features
GENERATE_SOURCEMAP=false
REACT_APP_CONSOLE_LOGGING=false

# Restrictive CORS
REACT_APP_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Staging Environment

**File**: `.env.staging`

```bash
REACT_APP_BACKEND_URL=https://your-backend-staging.onrender.com
REACT_APP_ENVIRONMENT=staging
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=info

# Testing features
REACT_APP_BUNDLE_ANALYZE=true
REACT_APP_ENABLE_TEST_DATA=true
```

## Feature Flags

Control which features are enabled in different environments:

```bash
# AI and Smart Features
REACT_APP_FEATURE_AI_RECOMMENDATIONS=true
REACT_APP_FEATURE_VOICE_ORDERS=true

# Core Features
REACT_APP_FEATURE_ANALYTICS=true
REACT_APP_FEATURE_INVENTORY=true
REACT_APP_FEATURE_STAFF_MANAGEMENT=true
REACT_APP_FEATURE_KITCHEN_DISPLAY=true

# Customer Features
REACT_APP_FEATURE_QR_ORDERING=true
REACT_APP_FEATURE_LOYALTY_PROGRAM=true

# Business Features
REACT_APP_FEATURE_MULTI_LOCATION=true
```

## Development Server Configuration

```bash
# Development server port
PORT=3000

# Host configuration
HOST=localhost

# HTTPS configuration (optional)
HTTPS=false
SSL_CRT_FILE=
SSL_KEY_FILE=

# Performance settings
DISABLE_HOT_RELOAD=false
FAST_REFRESH=true
SKIP_PREFLIGHT_CHECK=true
```

## Build and Performance Configuration

```bash
# Source map generation
GENERATE_SOURCEMAP=true

# Bundle optimization
REACT_APP_CODE_SPLITTING=true
REACT_APP_LAZY_LOADING=true

# Image optimization
REACT_APP_IMAGE_OPTIMIZATION=true
REACT_APP_IMAGE_LAZY_LOADING=true

# Caching strategy
REACT_APP_CACHE_EXPIRY=3600000
```

## Analytics and Monitoring

### Google Analytics

```bash
# Google Analytics tracking
REACT_APP_GA_TRACKING_ID=GA-XXXXXXXXX-X

# Google Tag Manager
REACT_APP_GTM_ID=GTM-XXXXXXX
```

### Error Tracking (Sentry)

```bash
# Sentry configuration
REACT_APP_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
REACT_APP_SENTRY_ENVIRONMENT=development
```

## Security Configuration

```bash
# Authentication settings
REACT_APP_JWT_EXPIRY=24h
REACT_APP_REMEMBER_ME_EXPIRY=30d

# Storage keys (should be unique per environment)
REACT_APP_SESSION_STORAGE_KEY=restobill_session
REACT_APP_USER_STORAGE_KEY=restobill_user
REACT_APP_TOKEN_STORAGE_KEY=restobill_token

# CORS settings
REACT_APP_CORS_ENABLED=true
REACT_APP_ALLOWED_ORIGINS=http://localhost:3000
```

## WebSocket Configuration

```bash
# Real-time features
REACT_APP_WEBSOCKET_URL=ws://localhost:5000/ws
REACT_APP_WEBSOCKET_RECONNECT=true
REACT_APP_WEBSOCKET_RECONNECT_INTERVAL=5000
```

## PWA (Progressive Web App) Configuration

```bash
# Service worker
REACT_APP_SERVICE_WORKER=true
REACT_APP_OFFLINE_SUPPORT=true

# PWA settings
REACT_APP_PWA_ENABLED=true
REACT_APP_PWA_CACHE_STRATEGY=cache-first
REACT_APP_PWA_CACHE_VERSION=v1.0.0
```

## Deployment Platform Configuration

### Render Deployment

For deploying the frontend on Render, set these environment variables in your Render dashboard:

```bash
# Essential variables
REACT_APP_BACKEND_URL=https://your-backend-app.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_live_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_production_api_key

# Build settings
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

### Vercel Deployment

```bash
# Vercel environment variables
REACT_APP_BACKEND_URL=https://your-backend-domain.com
REACT_APP_VERCEL_URL=$VERCEL_URL
```

### Netlify Deployment

```bash
# Netlify environment variables
REACT_APP_BACKEND_URL=https://your-backend-domain.com
REACT_APP_NETLIFY_SITE_URL=$DEPLOY_PRIME_URL
```

## Environment Variable Naming Conventions

### React App Variables (Frontend Access)

All variables that need to be accessible in the React app MUST be prefixed with `REACT_APP_`:

```bash
# ✅ Correct - Available in React app
REACT_APP_API_URL=https://api.example.com
REACT_APP_FEATURE_FLAG=true

# ❌ Incorrect - Not available in React app
API_URL=https://api.example.com
FEATURE_FLAG=true
```

### Build Tool Variables

Variables used by build tools don't need the `REACT_APP_` prefix:

```bash
# Build and development server settings
PORT=3000
HOST=localhost
HTTPS=false
GENERATE_SOURCEMAP=true
```

## Security Best Practices

### 1. Environment Separation

- **Never** use production keys in development
- **Never** commit `.env.local` to version control
- Use different API keys for each environment

### 2. API Key Security

```bash
# ✅ Good - Test keys for development
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx

# ❌ Bad - Live keys in development
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
```

### 3. Sensitive Data

**Remember**: All `REACT_APP_*` variables are publicly accessible in the browser. Never put sensitive data like:
- API secrets
- Private keys
- Database passwords
- Internal service tokens

## Common Environment Issues

### 1. Backend Connection Failed

**Problem**: `Failed to fetch` or `Network Error`

**Solutions**:
```bash
# Check backend URL format (no trailing slash)
REACT_APP_BACKEND_URL=http://localhost:5000  # ✅ Correct
REACT_APP_BACKEND_URL=http://localhost:5000/ # ❌ Incorrect

# Verify backend is running
curl http://localhost:5000/api/health

# Check CORS settings in backend
```

### 2. Environment Variables Not Loading

**Problem**: Variables show as `undefined` in React app

**Solutions**:
- Ensure variables have `REACT_APP_` prefix
- Restart development server after adding variables
- Check for typos in variable names

### 3. Payment Gateway Issues

**Problem**: Payment integration not working

**Solutions**:
```bash
# Verify key format
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx  # Test key
REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx  # Live key

# Check if payments are enabled
REACT_APP_RAZORPAY_ENABLED=true
```

## Testing Environment Variables

Create a simple test component to verify your environment variables:

```jsx
// src/components/EnvTest.jsx
import React from 'react';

const EnvTest = () => {
  const envVars = {
    'Backend URL': process.env.REACT_APP_BACKEND_URL,
    'Environment': process.env.REACT_APP_ENVIRONMENT,
    'Razorpay Enabled': process.env.REACT_APP_RAZORPAY_ENABLED,
    'Debug Mode': process.env.REACT_APP_DEBUG,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h3>Environment Variables Test</h3>
      {Object.entries(envVars).map(([key, value]) => (
        <div key={key}>
          <strong>{key}:</strong> {value || 'Not set'}
        </div>
      ))}
    </div>
  );
};

export default EnvTest;
```

## Validation Script

Create a script to validate your environment configuration:

```javascript
// scripts/validate-env.js
const requiredVars = [
  'REACT_APP_BACKEND_URL',
  'REACT_APP_RAZORPAY_KEY_ID',
  'REACT_APP_ENVIRONMENT'
];

const optionalVars = [
  'REACT_APP_GOOGLE_MAPS_API_KEY',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_GA_TRACKING_ID'
];

console.log('🔍 Validating environment variables...\n');

// Check required variables
const missingRequired = requiredVars.filter(
  varName => !process.env[varName]
);

if (missingRequired.length > 0) {
  console.log('❌ Missing required variables:');
  missingRequired.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  process.exit(1);
} else {
  console.log('✅ All required variables are set');
}

// Check optional variables
const missingOptional = optionalVars.filter(
  varName => !process.env[varName]
);

if (missingOptional.length > 0) {
  console.log('\n⚠️  Missing optional variables:');
  missingOptional.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}

console.log('\n🎉 Environment validation complete!');
```

Run with: `node scripts/validate-env.js`

## Environment Checklist

### Development Setup ✅

- [ ] Copied `.env.local.template` to `.env.local`
- [ ] Set `REACT_APP_BACKEND_URL` to local backend
- [ ] Added Razorpay test key
- [ ] Added Google Maps API key
- [ ] Backend server is running
- [ ] Frontend connects to backend successfully

### Staging Deployment ✅

- [ ] Set staging backend URL
- [ ] Use test payment keys
- [ ] Configure staging Firebase project
- [ ] Set up staging analytics
- [ ] Test all integrations

### Production Deployment ✅

- [ ] Set production backend URL
- [ ] Use live payment keys
- [ ] Configure production Firebase
- [ ] Set up production analytics
- [ ] Enable error monitoring
- [ ] Disable debug features
- [ ] Test payment flows
- [ ] Verify SSL certificates

## Support and Troubleshooting

### Common Commands

```bash
# Check environment variables in React app
console.log(process.env);

# Restart development server
npm start

# Build for production
npm run build

# Analyze bundle size
npm run build -- --analyze
```

### Debug Environment Loading

Add this to your `src/index.js` temporarily:

```javascript
// Debug environment variables (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Variables:', {
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
    RAZORPAY_ENABLED: process.env.REACT_APP_RAZORPAY_ENABLED,
  });
}
```

### Getting Help

1. **Check browser console** for error messages
2. **Verify backend connectivity** with curl or Postman
3. **Test API endpoints** directly
4. **Check network tab** for failed requests
5. **Verify environment variable spelling** and formatting

## Resources

- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Razorpay Integration Guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Render Environment Variables](https://render.com/docs/environment-variables)

---

**Last Updated**: November 27, 2024  
**Version**: 1.0.0  
**Status**: Ready for Use ✅