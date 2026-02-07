# Environment Setup Guide

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/restobill-ai.git
cd restobill-ai
```

### 2. Install Security Hooks (Important!)
```bash
# Linux/Mac
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh

# Windows
setup-git-hooks.bat
```

### 3. Setup Backend Environment

```bash
cd backend

# Copy template to .env
cp .env.template .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

**Required credentials:**
- MongoDB connection string (get from [MongoDB Atlas](https://cloud.mongodb.com/))
- Redis credentials (get from [Upstash](https://console.upstash.com/))
- JWT secret (generate using `openssl rand -base64 32`)
- Admin password (choose a strong password)
- Email API key (get from [Resend](https://resend.com/))
- AI API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 4. Setup Frontend Environment

```bash
cd frontend

# Copy template to .env.local
cp .env.template .env.local

# Edit with your configuration
nano .env.local
```

**Configuration:**
- Backend URL (e.g., `http://localhost:10000`)
- Feature flags (enable/disable features)
- Development settings

### 5. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 6. Verify Setup

```bash
# Check that .env files are not tracked
git status

# You should NOT see:
# - backend/.env
# - frontend/.env.local
# - frontend/.env.production

# If you see them, they're in .gitignore correctly
```

### 7. Start Development

**Backend:**
```bash
cd backend
python server.py
```

**Frontend:**
```bash
cd frontend
npm start
```

---

## Detailed Setup

### MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com/
2. Create account (free tier available)
3. Create a new cluster
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Replace `<password>` with your database password
7. Add to `backend/.env` as `MONGO_URL`

### Upstash Redis Setup

1. Go to https://console.upstash.com/
2. Create account (free tier available)
3. Create a Redis database
4. Copy REST URL and Token
5. Add to `backend/.env`:
   ```
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

### Email Service Setup (Resend)

1. Go to https://resend.com/
2. Create account (free tier: 100 emails/day)
3. Go to API Keys
4. Create new API key
5. Add to `backend/.env`:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

### AI Service Setup (Google Gemini)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Create API key
4. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### Generate JWT Secret

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `backend/.env`:
```
JWT_SECRET=your_generated_secret_here
```

---

## Environment Files

### Backend Environment Variables

**Required:**
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: restrobill)
- `JWT_SECRET` - Secret for JWT tokens (32+ characters)
- `SUPER_ADMIN_USERNAME` - Admin username
- `SUPER_ADMIN_PASSWORD` - Admin password
- `RESEND_API_KEY` - Email service API key

**Optional:**
- `UPSTASH_REDIS_REST_URL` - Redis cache URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis cache token
- `GEMINI_API_KEY` - AI service API key
- `TWILIO_ACCOUNT_SID` - SMS service SID
- `TWILIO_AUTH_TOKEN` - SMS service token

See `backend/.env.template` for complete list.

### Frontend Environment Variables

**Required:**
- `REACT_APP_BACKEND_URL` - Backend server URL
- `REACT_APP_API_URL` - API endpoint URL

**Optional:**
- Feature flags (enable/disable features)
- Development settings
- Performance monitoring

See `frontend/.env.template` for complete list.

---

## Security Best Practices

### ✅ DO

- Use `.env.template` files as reference
- Keep `.env` files local (never commit)
- Use strong passwords (16+ characters)
- Generate random JWT secrets
- Enable 2FA on all services
- Rotate credentials regularly
- Use environment variables in production

### ❌ DON'T

- Commit `.env` files to git
- Share credentials via email/Slack
- Use weak passwords
- Hardcode credentials in code
- Reuse passwords across services
- Ignore security warnings
- Skip 2FA setup

---

## Troubleshooting

### .env file is tracked by git

```bash
# Remove from git (keeps local file)
git rm --cached backend/.env
git rm --cached frontend/.env.local

# Commit the removal
git commit -m "Remove .env files from tracking"
```

### Missing environment variables

```bash
# Check which variables are missing
cd backend
python -c "from core.config import settings; print('Config loaded successfully')"

# If error, check .env file has all required variables
```

### Connection errors

**MongoDB:**
- Verify connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

**Redis:**
- Verify URL and token are correct
- Check Upstash dashboard for status

**API Keys:**
- Verify keys are active
- Check usage limits
- Ensure no extra spaces in .env file

---

## Production Deployment

### Environment Variables in Production

**DO NOT use .env files in production!**

Instead, use your platform's environment variable management:

**Render.com:**
1. Go to Dashboard > Your Service
2. Click "Environment"
3. Add variables one by one
4. Mark sensitive values as "Secret"

**Vercel:**
1. Go to Project Settings
2. Click "Environment Variables"
3. Add variables for each environment
4. Mark sensitive values as "Sensitive"

**Docker:**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - MONGO_URL=${MONGO_URL}
      - JWT_SECRET=${JWT_SECRET}
      # ... other variables
```

### Security Checklist

Before deploying to production:

- [ ] All credentials in environment variables
- [ ] No .env files in repository
- [ ] Strong passwords used
- [ ] 2FA enabled on all services
- [ ] HTTPS only
- [ ] Security headers enabled
- [ ] Monitoring configured
- [ ] Backup credentials stored securely
- [ ] Team has access to credential vault

---

## Additional Resources

- **Security Guide**: `SECURITY_BEST_PRACTICES.md`
- **Quick Reference**: `SECURITY_QUICK_REFERENCE.md`
- **Emergency Guide**: `SECURITY_REMEDIATION_URGENT.md`
- **Backend Template**: `backend/.env.template`
- **Frontend Template**: `frontend/.env.template`

---

## Getting Help

### Documentation
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Upstash Redis: https://docs.upstash.com/
- Resend Email: https://resend.com/docs
- Google Gemini: https://ai.google.dev/docs

### Support
- Create an issue in the repository
- Check existing documentation
- Review error logs
- Contact team lead

---

## Next Steps

After setup:

1. ✅ Verify application runs locally
2. ✅ Test all features
3. ✅ Review security settings
4. ✅ Document any custom configuration
5. ✅ Share setup experience with team

**Happy coding! 🚀**
