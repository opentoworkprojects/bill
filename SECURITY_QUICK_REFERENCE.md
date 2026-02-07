# Security Quick Reference

## 🚨 Emergency: Credentials Leaked

**If you accidentally committed credentials, act immediately:**

```bash
# 1. Rotate ALL compromised credentials NOW
#    - MongoDB: Create new user
#    - Redis: Regenerate token
#    - API Keys: Revoke and create new

# 2. Remove from git history (choose one method)

# Method A: BFG (fastest)
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Method B: git filter-repo (recommended)
pip install git-filter-repo
git filter-repo --path backend/.env --invert-paths
git push --force --all

# 3. Update production with new credentials
# 4. Monitor for unauthorized access
```

---

## ✅ Daily Checklist

**Before every commit:**
```bash
# 1. Check what you're committing
git status

# 2. Review the diff
git diff --cached

# 3. Ensure no .env files
git diff --cached --name-only | grep -E '\.env'

# 4. Commit if safe
git commit -m "Your message"
```

---

## 🔧 Setup New Environment

**Backend:**
```bash
cd backend
cp .env.template .env
nano .env  # Fill in your credentials
```

**Frontend:**
```bash
cd frontend
cp .env.template .env.local
nano .env.local  # Fill in your configuration
```

**Verify:**
```bash
git status  # .env files should NOT appear
```

---

## 🔐 Generate Secure Secrets

**JWT Secret:**
```bash
openssl rand -base64 32
```

**Strong Password:**
```bash
openssl rand -base64 16
```

**Random String:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🛡️ Install Security Hooks

**Linux/Mac:**
```bash
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh
```

**Windows:**
```cmd
setup-git-hooks.bat
```

---

## 📋 Credential Locations

### Development
- **Backend**: `backend/.env` (local only, not committed)
- **Frontend**: `frontend/.env.local` (local only, not committed)

### Production
- **Render**: Dashboard > Environment Variables
- **Vercel**: Project Settings > Environment Variables
- **Docker**: Pass via environment or secrets

### Templates (Safe to commit)
- `backend/.env.template` ✅
- `backend/.env.example` ✅
- `frontend/.env.template` ✅

---

## 🔍 Check for Secrets

**Scan repository:**
```bash
# Using grep
git grep -E 'mongodb\+srv://[^:]+:[^@]+@'
git grep -E 'sk-[A-Za-z0-9]{32,}'
git grep -E 'AIza[A-Za-z0-9_-]{35}'

# Using gitleaks
brew install gitleaks
gitleaks detect --source . --verbose

# Using trufflehog
pip install trufflehog
trufflehog git file://. --only-verified
```

---

## 📝 What to Commit vs Not Commit

### ❌ NEVER Commit
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- `*.key`, `*.pem`
- `*.keystore`, `*.jks`
- Any file with actual credentials

### ✅ Safe to Commit
- `.env.example` (placeholders only)
- `.env.template` (placeholders only)
- `README.md`
- `.gitignore`
- Code files (without hardcoded secrets)

---

## 🔄 Credential Rotation

**When to rotate:**
- Every 90 days (API keys)
- Every 180 days (database passwords)
- Immediately if leaked
- When team member leaves

**How to rotate:**
1. Generate new credential
2. Update production environment
3. Test application
4. Revoke old credential
5. Update documentation

---

## 🚀 Deployment Checklist

**Before deploying:**
- [ ] All credentials in environment variables (not .env files)
- [ ] No .env files in repository
- [ ] Security headers enabled
- [ ] HTTPS only
- [ ] 2FA enabled on all services
- [ ] Monitoring configured
- [ ] Backup credentials stored securely

---

## 📞 Get Help

**Resources:**
- Full guide: `SECURITY_BEST_PRACTICES.md`
- Remediation: `SECURITY_REMEDIATION_URGENT.md`
- Templates: `backend/.env.template`, `frontend/.env.template`

**Tools:**
- BFG: https://rtyley.github.io/bfg-repo-cleaner/
- git-secrets: https://github.com/awslabs/git-secrets
- Gitleaks: https://github.com/gitleaks/gitleaks

**Services:**
- Doppler: https://doppler.com/
- MongoDB Atlas: https://cloud.mongodb.com/
- Upstash Redis: https://console.upstash.com/

---

## 💡 Pro Tips

1. **Use a password manager** for team credential sharing
2. **Enable 2FA** on all services
3. **Audit access logs** monthly
4. **Document everything** in team wiki
5. **Test incident response** quarterly
6. **Keep backups** of credentials in secure vault
7. **Review .gitignore** regularly
8. **Train team members** on security practices

---

## ⚠️ Common Mistakes

1. ❌ Committing `.env` files
2. ❌ Hardcoding credentials in code
3. ❌ Using weak passwords
4. ❌ Sharing credentials via email/Slack
5. ❌ Not rotating credentials
6. ❌ Ignoring security warnings
7. ❌ Skipping 2FA
8. ❌ Not documenting credential locations

---

## 🎯 Remember

> **When in doubt, don't commit it!**

If you're unsure whether something should be committed:
1. Check if it contains credentials
2. Ask yourself: "Would I want this public?"
3. Review with team if uncertain
4. Use templates for examples

**Security is everyone's responsibility!**
