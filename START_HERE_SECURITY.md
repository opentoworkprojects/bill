# 🚨 START HERE - Security Remediation

## What Happened?

Your `.env` files containing sensitive credentials were committed to the Git repository. This means:
- Database passwords are exposed
- API keys are visible
- Admin credentials are public

**This needs to be fixed immediately!**

---

## What You Need to Do RIGHT NOW

### Step 1: Rotate Credentials (30 minutes)

**Do this FIRST before anything else!**

#### 1.1 MongoDB (5 min)
1. Go to https://cloud.mongodb.com/
2. Click on your cluster → Database Access
3. Delete user: `shivshankarkumar281_db_user`
4. Create new user with strong password
5. Copy new connection string
6. Save it securely (you'll need it later)

#### 1.2 Redis (5 min)
1. Go to https://console.upstash.com/
2. Click on your Redis database
3. Go to Details → REST API
4. Click "Regenerate Token"
5. Copy new URL and Token
6. Save them securely

#### 1.3 Resend Email (2 min)
1. Go to https://resend.com/api-keys
2. Find key: `re_Mm6YAYfo_K6yhv5PVPXwMEj3SS2nuEgHm`
3. Click Delete
4. Create new API key
5. Copy and save it securely

#### 1.4 Google Gemini (2 min)
1. Go to https://makersuite.google.com/app/apikey
2. Find key: `AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA`
3. Delete it
4. Create new API key
5. Copy and save it securely

#### 1.5 Twilio (5 min)
1. Go to https://console.twilio.com/
2. Go to Account → API keys & tokens
3. Click "Create new Auth Token"
4. Copy and save it securely

#### 1.6 Admin Password (1 min)
- Choose a strong password (16+ characters)
- Save it securely
- You'll change it in the app after deployment

### Step 2: Update Production (10 minutes)

#### 2.1 Update Render (Backend)
1. Go to https://dashboard.render.com/
2. Click on your backend service
3. Go to "Environment" tab
4. Update these variables with NEW credentials:
   - `MONGO_URL` → New MongoDB connection string
   - `UPSTASH_REDIS_REST_URL` → New Redis URL
   - `UPSTASH_REDIS_REST_TOKEN` → New Redis token
   - `RESEND_API_KEY` → New Resend key
   - `GEMINI_API_KEY` → New Gemini key
   - `TWILIO_AUTH_TOKEN` → New Twilio token
   - `SUPER_ADMIN_PASSWORD` → New admin password
5. Click "Save Changes"
6. Wait for automatic redeploy

#### 2.2 Test Application
```bash
# Test backend is working
curl https://your-backend.onrender.com/health

# If error, check Render logs:
# Dashboard > Your Service > Logs
```

### Step 3: Update Local Environment (5 minutes)

```bash
# Navigate to backend
cd backend

# Backup old .env (just in case)
cp .env .env.backup

# Create new .env from template
cp .env.template .env

# Edit .env with NEW credentials
nano .env  # or use your preferred editor

# Add your NEW credentials:
# - MONGO_URL=<new MongoDB connection string>
# - UPSTASH_REDIS_REST_URL=<new Redis URL>
# - UPSTASH_REDIS_REST_TOKEN=<new Redis token>
# - RESEND_API_KEY=<new Resend key>
# - GEMINI_API_KEY=<new Gemini key>
# - TWILIO_AUTH_TOKEN=<new Twilio token>
# - SUPER_ADMIN_PASSWORD=<new admin password>
# - JWT_SECRET=<generate new: openssl rand -base64 32>
```

```bash
# Test locally
python server.py

# If it works, you're good!
```

---

## What to Do Next (Within 24 Hours)

### Remove Files from Git History

**This is important to prevent future issues!**

#### Option 1: Using BFG (Easiest)

```bash
# 1. Download BFG
# Go to: https://rtyley.github.io/bfg-repo-cleaner/
# Download bfg.jar

# 2. Create backup (IMPORTANT!)
cd ..
git clone --mirror https://github.com/yourusername/restobill-ai.git restobill-backup

# 3. Run BFG
java -jar bfg.jar --delete-files .env restobill-ai
java -jar bfg.jar --delete-files .env.production restobill-ai
java -jar bfg.jar --delete-files .env.local restobill-ai

# 4. Clean up
cd restobill-ai
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (WARNING: This will rewrite history!)
git push --force
```

#### Option 2: Using git filter-repo

```bash
# 1. Install
pip install git-filter-repo

# 2. Create backup
cd ..
git clone https://github.com/yourusername/restobill-ai.git restobill-backup

# 3. Remove files
cd restobill-ai
git filter-repo --path backend/.env --invert-paths
git filter-repo --path backend/.env.production --invert-paths
git filter-repo --path frontend/.env --invert-paths
git filter-repo --path frontend/.env.local --invert-paths

# 4. Force push
git remote add origin https://github.com/yourusername/restobill-ai.git
git push --force --all
```

### Install Security Hooks

**Prevent this from happening again!**

```bash
# Linux/Mac
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh

# Windows
setup-git-hooks.bat
```

---

## Verification Checklist

### Immediate (Done?)
- [ ] MongoDB credentials rotated
- [ ] Redis credentials rotated
- [ ] Resend API key rotated
- [ ] Gemini API key rotated
- [ ] Twilio credentials rotated
- [ ] Admin password changed
- [ ] Production environment updated
- [ ] Application tested and working
- [ ] Local environment updated

### Within 24 Hours (Done?)
- [ ] Created backup of repository
- [ ] Removed .env files from git history
- [ ] Force pushed to remote
- [ ] Installed security hooks
- [ ] Verified no .env files in repository

---

## Quick Commands Reference

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

**Check what's in git:**
```bash
git status
git ls-files | grep .env
```

**Test backend:**
```bash
cd backend
python server.py
```

**Test frontend:**
```bash
cd frontend
npm start
```

---

## Need Help?

### Documentation
- **Full Guide**: `SECURITY_ACTION_PLAN.md`
- **Best Practices**: `SECURITY_BEST_PRACTICES.md`
- **Quick Reference**: `SECURITY_QUICK_REFERENCE.md`
- **Setup Guide**: `SETUP_ENVIRONMENT.md`

### Common Issues

**"Application not working after credential rotation"**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure no typos in credentials
- Test each service individually

**"Can't remove files from git history"**
- Make sure you have a backup first
- Try a different method (BFG vs git filter-repo)
- Check you have the correct file paths
- Ensure you have write access to repository

**"Team members can't pull after force push"**
- They should NOT pull
- They should run: `git fetch origin && git reset --hard origin/main`
- They need to recreate their .env files

---

## Timeline

| Task | Time | Priority |
|------|------|----------|
| Rotate credentials | 30 min | 🔴 CRITICAL |
| Update production | 10 min | 🔴 CRITICAL |
| Update local env | 5 min | 🔴 CRITICAL |
| Remove from git | 30 min | 🟡 URGENT |
| Install hooks | 5 min | 🟡 URGENT |
| Verify everything | 10 min | 🟡 URGENT |

**Total Time: ~1.5 hours**

---

## After You're Done

1. ✅ Verify application works in production
2. ✅ Verify application works locally
3. ✅ Check git repository has no .env files
4. ✅ Security hooks are installed
5. ✅ Document new credentials in secure location
6. ✅ Enable 2FA on all services
7. ✅ Notify team members (if any)

---

## Remember

> **The old credentials are compromised and must be rotated immediately!**

Even after removing them from git, they were exposed and should be considered compromised. Rotation is not optional.

---

## Questions?

- Read the detailed guides in this repository
- Check the troubleshooting sections
- Review service documentation
- Create an issue (without sensitive info)

**You've got this! 💪**

Let's secure your application and prevent this from happening again.
