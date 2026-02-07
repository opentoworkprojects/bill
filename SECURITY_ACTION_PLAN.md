# Security Action Plan - Credential Leak Remediation

## Status: 🚨 URGENT ACTION REQUIRED

**Date**: February 8, 2026  
**Priority**: CRITICAL  
**Estimated Time**: 2-4 hours

---

## Executive Summary

Sensitive credentials have been committed to the Git repository and are currently exposed. This document outlines the immediate actions required to secure the application and prevent future incidents.

---

## Phase 1: IMMEDIATE (Within 1 Hour) ⚡

### 1.1 Rotate All Compromised Credentials

**Priority: CRITICAL - Do this FIRST!**

| Service | Action | Link |
|---------|--------|------|
| MongoDB Atlas | Create new user, delete old one | https://cloud.mongodb.com/ |
| Upstash Redis | Regenerate REST token | https://console.upstash.com/ |
| Resend Email | Revoke and create new API key | https://resend.com/api-keys |
| Google Gemini | Delete and create new API key | https://makersuite.google.com/app/apikey |
| Twilio SMS | Regenerate auth token | https://console.twilio.com/ |
| Admin Password | Change to strong password | In application settings |

**Exposed Credentials:**
```
MongoDB: shivshankarkumar281_db_user:RNdGNCCyBtj1d5Ar
Redis: LNnMPoRCIpDIzrOvgFaPnceFZw8z8b2B
Resend: re_Mm6YAYfo_K6yhv5PVPXwMEj3SS2nuEgHm
Gemini: AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA
Twilio SID: AC7d1b5339f42fe305334b9865cb5bdce7
Twilio Token: 4e29f852c9cf783ea3ca1ba29a1fbf23
Admin: shiv:shiv@123
```

### 1.2 Update Production Environment

**Render.com (Backend):**
1. Go to Dashboard > restobill-backend
2. Navigate to Environment tab
3. Update all rotated credentials
4. Click "Save Changes"
5. Service will auto-redeploy

**Vercel (Frontend):**
1. Go to Project Settings
2. Navigate to Environment Variables
3. Update any affected variables
4. Redeploy if necessary

### 1.3 Verify Application Works

```bash
# Test backend
curl https://your-backend.onrender.com/health

# Test frontend
curl https://your-frontend.vercel.app

# Check logs for errors
# Render: Dashboard > Logs
# Vercel: Deployments > View Function Logs
```

---

## Phase 2: URGENT (Within 24 Hours) 🔥

### 2.1 Remove Sensitive Files from Git History

**Choose ONE method:**

#### Option A: BFG Repo-Cleaner (Fastest - Recommended)

```bash
# 1. Download BFG
# From: https://rtyley.github.io/bfg-repo-cleaner/
# Save as: bfg.jar

# 2. Create backup
git clone --mirror https://github.com/yourusername/restobill-ai.git restobill-backup

# 3. Run BFG
java -jar bfg.jar --delete-files backend/.env restobill-ai.git
java -jar bfg.jar --delete-files backend/.env.production restobill-ai.git
java -jar bfg.jar --delete-files frontend/.env restobill-ai.git
java -jar bfg.jar --delete-files frontend/.env.local restobill-ai.git

# 4. Clean up
cd restobill-ai.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push
git push --force
```

#### Option B: git filter-repo (Modern Alternative)

```bash
# 1. Install
pip install git-filter-repo

# 2. Create backup
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
git push --force --tags
```

#### Option C: git filter-branch (Legacy)

```bash
# 1. Create backup
git clone https://github.com/yourusername/restobill-ai.git restobill-backup

# 2. Filter history
cd restobill-ai
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env backend/.env.production frontend/.env frontend/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. Force push
git push origin --force --all
git push origin --force --tags
```

### 2.2 Notify Team

**Send to all team members:**

```
Subject: URGENT: Git Repository Force Push - Action Required

Team,

We've removed sensitive files from our git history for security reasons.
This requires a force push, which will affect everyone's local repository.

ACTION REQUIRED:

1. Commit and push any pending work NOW
2. After the force push (I'll notify you), run:
   
   git fetch origin
   git reset --hard origin/main
   
3. Re-setup your .env files:
   
   cd backend
   cp .env.template .env
   # Fill in credentials (get from [secure location])
   
   cd frontend
   cp .env.template .env.local
   # Fill in configuration

4. Install security hooks:
   
   ./setup-git-hooks.sh  # Linux/Mac
   setup-git-hooks.bat   # Windows

DO NOT pull or merge - use reset --hard as shown above.

Questions? Contact me directly.
```

### 2.3 Audit Access Logs

**Check for unauthorized access:**

- MongoDB Atlas: Database Access > Activity Feed
- Upstash Redis: Analytics > Access Logs
- Resend: Logs > API Requests
- Google Cloud: APIs & Services > Credentials > Usage
- Twilio: Monitor > Logs > API Requests

**Look for:**
- Unusual access patterns
- Unknown IP addresses
- Failed authentication attempts
- Unexpected API usage

---

## Phase 3: IMPORTANT (Within 1 Week) 📋

### 3.1 Install Security Hooks

**All team members must run:**

```bash
# Linux/Mac
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh

# Windows
setup-git-hooks.bat
```

### 3.2 Setup Secrets Management (Optional but Recommended)

**Option 1: Doppler (Recommended for teams)**

```bash
# Install
brew install dopplerhq/cli/doppler  # macOS
# or
curl -sLf https://cli.doppler.com/install.sh | sh  # Linux

# Setup
doppler login
doppler setup

# Use
doppler run -- python backend/server.py
doppler run -- npm start
```

**Option 2: AWS Secrets Manager**
- Best for AWS deployments
- Automatic rotation
- Fine-grained access control

**Option 3: HashiCorp Vault**
- Enterprise-grade
- Self-hosted option
- Dynamic secrets

### 3.3 Enable 2FA on All Services

**Enable 2FA on:**
- [ ] GitHub account
- [ ] MongoDB Atlas
- [ ] Upstash Redis
- [ ] Resend
- [ ] Google Cloud
- [ ] Twilio
- [ ] Render.com
- [ ] Vercel

### 3.4 Document Credential Locations

**Create secure documentation:**

1. Use password manager (1Password, LastPass, Bitwarden)
2. Create shared vault for team
3. Document:
   - Where each credential is used
   - How to rotate it
   - Who has access
   - Last rotation date

### 3.5 Setup Monitoring

**GitHub:**
- Enable secret scanning (Settings > Security > Secret scanning)
- Enable Dependabot alerts

**Application:**
- Setup error monitoring (Sentry, Rollbar)
- Configure alerts for failed auth attempts
- Monitor API usage patterns

---

## Phase 4: ONGOING 🔄

### 4.1 Regular Security Audits

**Monthly:**
- Review access logs
- Check for unusual activity
- Verify team member access

**Quarterly:**
- Rotate credentials
- Review security practices
- Update documentation
- Test incident response

**Annually:**
- Full security audit
- Penetration testing
- Update security policies

### 4.2 Team Training

**Topics to cover:**
- Why credentials shouldn't be committed
- How to use .env files properly
- How to use git hooks
- What to do if credentials are leaked
- How to use secrets management tools

### 4.3 Continuous Improvement

- Review and update security practices
- Stay informed about security best practices
- Update tools and dependencies
- Share lessons learned

---

## Verification Checklist

### Phase 1 (Immediate)
- [ ] MongoDB credentials rotated
- [ ] Redis credentials rotated
- [ ] Resend API key rotated
- [ ] Gemini API key rotated
- [ ] Twilio credentials rotated
- [ ] Admin password changed
- [ ] Production environment updated
- [ ] Application verified working

### Phase 2 (Urgent)
- [ ] Backup created
- [ ] Files removed from git history
- [ ] Force push completed
- [ ] Team notified
- [ ] Team members updated their repos
- [ ] Access logs audited
- [ ] No unauthorized access detected

### Phase 3 (Important)
- [ ] Security hooks installed (all team members)
- [ ] Secrets management setup (optional)
- [ ] 2FA enabled on all services
- [ ] Credentials documented in secure vault
- [ ] Monitoring configured
- [ ] Alerts setup

### Phase 4 (Ongoing)
- [ ] Monthly audit schedule created
- [ ] Quarterly rotation schedule created
- [ ] Team training scheduled
- [ ] Documentation updated
- [ ] Incident response plan tested

---

## Success Criteria

✅ **Security Restored When:**
1. All compromised credentials rotated
2. Application working with new credentials
3. Sensitive files removed from git history
4. No unauthorized access detected
5. Team members updated and trained
6. Security hooks installed
7. Monitoring in place

---

## Resources

### Documentation Created
- ✅ `SECURITY_REMEDIATION_URGENT.md` - Detailed remediation steps
- ✅ `SECURITY_BEST_PRACTICES.md` - Comprehensive security guide
- ✅ `SECURITY_QUICK_REFERENCE.md` - Quick reference for daily use
- ✅ `SETUP_ENVIRONMENT.md` - Environment setup guide
- ✅ `backend/.env.template` - Backend environment template
- ✅ `frontend/.env.template` - Frontend environment template
- ✅ `setup-git-hooks.sh` - Security hooks installer (Linux/Mac)
- ✅ `setup-git-hooks.bat` - Security hooks installer (Windows)

### External Resources
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
- git-secrets: https://github.com/awslabs/git-secrets
- git-filter-repo: https://github.com/newren/git-filter-repo
- OWASP Secrets Management: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- GitHub Security: https://docs.github.com/en/code-security

---

## Timeline Summary

| Phase | Timeframe | Status |
|-------|-----------|--------|
| Phase 1: Rotate credentials | 1 hour | ⏳ Pending |
| Phase 2: Clean git history | 24 hours | ⏳ Pending |
| Phase 3: Implement security | 1 week | ⏳ Pending |
| Phase 4: Ongoing monitoring | Continuous | ⏳ Pending |

---

## Contact

**Questions or Issues?**
- Review documentation in this repository
- Check security guides
- Contact security team
- Create issue (without sensitive info)

**Remember: Security is everyone's responsibility!** 🔒
