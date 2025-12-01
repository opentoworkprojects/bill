# Render Environment Variables for BillByteKOT AI
================================================

## Quick Setup Instructions

1. Go to your Render Dashboard: https://dashboard.render.com
2. Navigate to your `restro-ai` service
3. Click on the **Environment** tab
4. Add/Update these environment variables:

## Required Environment Variables

### Database Configuration
```
MONGO_URL=mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai
```

```
DB_NAME=restrobill
```

### Security Configuration
```
JWT_SECRET=your-secure-jwt-secret-32-characters-minimum-change-this
```

```
JWT_ALGORITHM=HS256
```

### Application Configuration
```
ENVIRONMENT=production
```

```
HOST=0.0.0.0
```

```
PORT=10000
```

```
DEBUG=false
```

```
LOG_LEVEL=info
```

## Optional Environment Variables

### Payment Gateway (Razorpay)
```
RAZORPAY_KEY_ID=your_razorpay_key_id_here
```

```
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### External Services
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

```
FIREBASE_PROJECT_ID=your_firebase_project_id_here
```

```
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

## Alternative Connection Strings (Backup)

If the primary MONGO_URL fails, try these alternatives:

### Option 1: TLS Bypass
```
MONGO_URL=mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&tls=true&tlsInsecure=true&authSource=admin&appName=retsro-ai
```

### Option 2: Minimal Configuration
```
MONGO_URL=mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&appName=retsro-ai
```

### Option 3: Production Optimized
```
MONGO_URL=mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primaryPreferred&maxIdleTimeMS=120000&appName=retsro-ai
```

## Step-by-Step Render Setup

### Step 1: Access Your Service
1. Login to Render Dashboard
2. Find your `restro-ai` service
3. Click on the service name

### Step 2: Update Environment Variables
1. Click **Environment** tab in the left sidebar
2. For each variable below, either:
   - Click **Add Environment Variable** (if new)
   - Click **Edit** next to existing variables

### Step 3: Required Variables Setup
Copy and paste each of these:

**MONGO_URL** (most important):
```
mongodb+srv://shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar@retsro-ai.un0np9m.mongodb.net/restrobill?retryWrites=true&w=majority&authSource=admin&readPreference=primary&appName=retsro-ai
```

**DB_NAME**:
```
restrobill
```

**JWT_SECRET** (CHANGE THIS):
```
your-super-secure-jwt-secret-key-at-least-32-characters-long-change-this
```

**ENVIRONMENT**:
```
production
```

### Step 4: Deploy Changes
1. Click **Save Changes** button
2. Render will automatically trigger a new deployment
3. Monitor the deployment logs

## Success Indicators

After deployment, look for these in the logs:
```
✅ Database connected: restrobill
🍽️  BillByteKOT AI Server Starting...
🚀 Server starting on port 10000
INFO: Uvicorn running on http://0.0.0.0:10000
```

## Test Your Deployment

### Health Check Endpoint
```bash
curl https://restro-ai.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "BillByteKOT AI Server is running",
  "services": {
    "database": "connected"
  }
}
```

### Root Endpoint
```bash
curl https://restro-ai.onrender.com/
```

### API Documentation
Visit: https://restro-ai.onrender.com/docs

## MongoDB Atlas Configuration Checklist

Ensure these settings in your MongoDB Atlas:

### Network Access
- ✅ Add `0.0.0.0/0` to IP Access List
- ✅ Or add Render IP ranges

### Database Access
- ✅ User: `shivshankarkumar281_db_user`
- ✅ Password: `RNdGNCCyBtj1d5Ar`
- ✅ Database: `restrobill`
- ✅ Permissions: `readWrite` or `Atlas Admin`

### Cluster Status
- ✅ Cluster `retsro-ai` is running
- ✅ Not paused or sleeping

## Troubleshooting

### Common Issues

**1. Connection Timeout**
- Check MongoDB Atlas Network Access
- Ensure `0.0.0.0/0` is in IP whitelist

**2. Authentication Failed**
- Verify username and password are exact
- Check user has database permissions

**3. Database Not Found**
- Ensure `DB_NAME=restrobill` is set
- Verify user has access to `restrobill` database

**4. SSL Handshake Failed**
- Try Alternative Connection String #1 (TLS Bypass)
- Check cluster SSL settings

### If Still Failing

Try connection strings in this order:
1. Primary (recommended)
2. TLS Bypass
3. Minimal
4. Production Optimized

## Security Notes

### Important Security Settings

1. **Change JWT_SECRET**: Use a randomly generated 32+ character string
2. **Razorpay Keys**: Use production keys for live payments
3. **API Keys**: Restrict Google Maps API key to your domains

### Example Secure JWT Secret
```bash
# Generate a secure JWT secret (Linux/Mac):
openssl rand -base64 32

# Or use online generator:
# Visit: https://generate-secret.now.sh/32
```

## Production Checklist

Before going live:
- [ ] MongoDB connection working (✅ in health check)
- [ ] JWT_SECRET changed from default
- [ ] Razorpay production keys configured
- [ ] Google Maps API key restricted to domains
- [ ] Error monitoring (Sentry) configured
- [ ] SSL certificate valid
- [ ] Domain configured (if using custom domain)

## Updated Information

- **MongoDB Cluster**: retsro-ai.un0np9m.mongodb.net
- **Username**: shivshankarkumar281_db_user  
- **Database**: restrobill
- **App Name**: retsro-ai
- **Connection Tests**: ✅ All 4 methods successful
- **Last Updated**: November 27, 2024
- **Status**: Ready for Production Deployment

## Support

If you encounter issues:
1. Check Render deployment logs
2. Verify MongoDB Atlas settings
3. Test connection strings locally
4. Monitor health check endpoint

Your BillByteKOT AI is ready to serve customers! 🍽️✨
