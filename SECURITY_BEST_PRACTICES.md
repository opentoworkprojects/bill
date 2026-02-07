# Security Best Practices for RestoBill AI

## Overview
This document outlines security best practices for managing credentials, secrets, and sensitive data in the RestoBill AI project.

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Git Security](#git-security)
3. [Credential Management](#credential-management)
4. [Deployment Security](#deployment-security)
5. [Development Workflow](#development-workflow)
6. [Incident Response](#incident-response)

---

## Environment Variables

### What NOT to Commit
**NEVER commit these files to version control:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- Any file containing API keys, passwords, or tokens
- Private keys (`.key`, `.pem`, `.p12`, `.pfx`)
- Keystores (`.keystore`, `.jks`)

### What TO Commit
**Safe to commit:**
- `.env.example` - Template with placeholder values
- `.env.template` - Detailed template with instructions
- `README.md` - Setup documentation
- `.gitignore` - Configured to exclude sensitive files

### Environment File Structure

```bash
# Project structure
backend/
  ├── .env                 # ❌ NEVER commit (actual credentials)
  ├── .env.example         # ✅ Commit (placeholders only)
  └── .env.template        # ✅ Commit (detailed template)

frontend/
  ├── .env.local           # ❌ NEVER commit (local dev config)
  ├── .env.production      # ❌ NEVER commit (production config)
  └── .env.template        # ✅ Commit (template)
```

---

## Git Security

### Pre-commit Hook
Prevent accidental commits of sensitive files:

**Create `.git/hooks/pre-commit`:**
```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for sensitive files
SENSITIVE_FILES=$(git diff --cached --name-only | grep -E '\.(env|env\..*)$|\.key$|\.pem$|\.keystore$|\.jks$')

if [ ! -z "$SENSITIVE_FILES" ]; then
    echo -e "${RED}ERROR: Attempting to commit sensitive files!${NC}"
    echo "Files detected:"
    echo "$SENSITIVE_FILES"
    echo ""
    echo "These files should not be committed to version control."
    echo "Add them to .gitignore or use git reset to unstage."
    exit 1
fi

# Check for potential secrets in code
if git diff --cached | grep -E 'api[_-]?key|password|secret|token' | grep -v '.env.example' | grep -v '.env.template'; then
    echo -e "${RED}WARNING: Potential secrets detected in code!${NC}"
    echo "Please review your changes carefully."
    read -p "Continue with commit? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

exit 0
```

**Make it executable:**
```bash
chmod +x .git/hooks/pre-commit
```

### Using git-secrets
Install and configure git-secrets to prevent committing secrets:

```bash
# Install (macOS)
brew install git-secrets

# Install (Linux)
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install

# Setup in your repository
cd /path/to/restobill-ai
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'mongodb\+srv://[^:]+:[^@]+'
git secrets --add 'redis://[^:]+:[^@]+'
git secrets --add 'Bearer [A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*'
git secrets --add '[A-Za-z0-9_]{32,}'
git secrets --add 'sk-[A-Za-z0-9]{32,}'
git secrets --add 're_[A-Za-z0-9]{32,}'
git secrets --add 'AIza[A-Za-z0-9_-]{35}'

# Scan repository
git secrets --scan
git secrets --scan-history
```

### Removing Committed Secrets

If you accidentally committed secrets, remove them immediately:

**Option 1: BFG Repo-Cleaner (Fastest)**
```bash
# Download from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.production
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

**Option 2: git filter-repo (Recommended)**
```bash
# Install
pip install git-filter-repo

# Remove files
git filter-repo --path backend/.env --invert-paths
git filter-repo --path backend/.env.production --invert-paths
git filter-repo --path frontend/.env --invert-paths
git filter-repo --path frontend/.env.local --invert-paths

# Force push
git push --force --all
```

**Option 3: git filter-branch (Legacy)**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env backend/.env.production" \
  --prune-empty --tag-name-filter cat -- --all

git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
```

---

## Credential Management

### Generating Secure Secrets

**JWT Secret (32+ characters):**
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Strong Passwords:**
```bash
# Using OpenSSL
openssl rand -base64 16

# Using pwgen (Linux)
pwgen -s 20 1
```

### Credential Rotation Schedule

| Credential Type | Rotation Frequency | Priority |
|----------------|-------------------|----------|
| API Keys | Every 90 days | High |
| Database Passwords | Every 180 days | Critical |
| JWT Secrets | Every 365 days | High |
| Admin Passwords | Every 90 days | Critical |
| Service Tokens | Every 90 days | High |

### Secrets Management Services

**Recommended Services:**

1. **Doppler** (Recommended for startups)
   - Free tier available
   - Easy integration
   - Team collaboration
   - https://doppler.com/

2. **AWS Secrets Manager**
   - Best for AWS deployments
   - Automatic rotation
   - Fine-grained access control

3. **HashiCorp Vault**
   - Enterprise-grade
   - Self-hosted option
   - Dynamic secrets

4. **Azure Key Vault**
   - Best for Azure deployments
   - Integrated with Azure services

**Setup Example (Doppler):**
```bash
# Install Doppler CLI
brew install dopplerhq/cli/doppler  # macOS
# or
curl -sLf https://cli.doppler.com/install.sh | sh  # Linux

# Login
doppler login

# Setup project
doppler setup

# Run with Doppler
doppler run -- python backend/server.py
doppler run -- npm start
```

---

## Deployment Security

### Environment Variables in Production

**Render.com:**
1. Go to Dashboard > Your Service > Environment
2. Add environment variables one by one
3. Never use .env files in production
4. Use "Secret" type for sensitive values

**Vercel:**
1. Go to Project Settings > Environment Variables
2. Add variables for each environment (Production, Preview, Development)
3. Mark sensitive variables as "Sensitive"
4. Use Vercel CLI for bulk import:
   ```bash
   vercel env add VARIABLE_NAME production
   ```

**Docker:**
```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env.production  # Not committed to repo
    # OR use environment variables directly
    environment:
      - MONGO_URL=${MONGO_URL}
      - JWT_SECRET=${JWT_SECRET}
```

**Kubernetes:**
```yaml
# Use Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: restobill-secrets
type: Opaque
data:
  mongo-url: <base64-encoded-value>
  jwt-secret: <base64-encoded-value>
```

### Security Headers

Ensure these headers are set in production:

```python
# backend/server.py
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

---

## Development Workflow

### Setting Up Local Environment

1. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/restobill-ai.git
   cd restobill-ai
   ```

2. **Setup backend:**
   ```bash
   cd backend
   cp .env.template .env
   # Edit .env with your credentials
   nano .env
   ```

3. **Setup frontend:**
   ```bash
   cd frontend
   cp .env.template .env.local
   # Edit .env.local with your configuration
   nano .env.local
   ```

4. **Verify .gitignore:**
   ```bash
   git status
   # Ensure .env files are not listed
   ```

### Team Collaboration

**Sharing Configuration (Safe Method):**

1. **Use password manager** (1Password, LastPass, Bitwarden)
   - Create shared vault for team
   - Store credentials securely
   - Share access with team members

2. **Use secrets management service** (Doppler, AWS Secrets Manager)
   - Centralized secret management
   - Audit logs
   - Access control

3. **Document required variables** (in README)
   - List all required environment variables
   - Explain where to get credentials
   - Don't include actual values

**Example README section:**
```markdown
## Environment Setup

Required environment variables:

- `MONGO_URL`: MongoDB connection string (get from MongoDB Atlas)
- `JWT_SECRET`: Random 32+ character string (generate using `openssl rand -base64 32`)
- `GEMINI_API_KEY`: Google Gemini API key (get from https://makersuite.google.com/)

See `.env.template` for complete list and setup instructions.
```

---

## Incident Response

### If Credentials Are Leaked

**Immediate Actions (within 1 hour):**

1. **Rotate compromised credentials immediately**
   - Generate new API keys
   - Change passwords
   - Update production environment

2. **Revoke old credentials**
   - Delete old API keys
   - Disable old database users
   - Invalidate old tokens

3. **Update production**
   - Deploy with new credentials
   - Verify application works
   - Monitor for issues

**Follow-up Actions (within 24 hours):**

4. **Remove from git history**
   - Use BFG or git filter-repo
   - Force push to remote
   - Notify team members to re-clone

5. **Audit access logs**
   - Check for unauthorized access
   - Review API usage
   - Monitor for suspicious activity

6. **Document incident**
   - What was leaked
   - How it happened
   - Steps taken to remediate
   - Prevention measures added

**Prevention (within 1 week):**

7. **Implement pre-commit hooks**
8. **Setup git-secrets**
9. **Enable 2FA on all services**
10. **Review and update security practices**

### Monitoring for Leaked Secrets

**GitHub Secret Scanning:**
- Automatically enabled for public repos
- Alerts when secrets are detected
- Configure in Settings > Security > Secret scanning

**Third-party Tools:**
- **GitGuardian**: https://www.gitguardian.com/
- **TruffleHog**: https://github.com/trufflesecurity/trufflehog
- **Gitleaks**: https://github.com/gitleaks/gitleaks

**Manual Scanning:**
```bash
# Using TruffleHog
pip install trufflehog
trufflehog git https://github.com/yourusername/restobill-ai.git

# Using Gitleaks
brew install gitleaks
gitleaks detect --source . --verbose
```

---

## Checklist

### Initial Setup
- [ ] Copy `.env.template` to `.env`
- [ ] Fill in all required credentials
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test application with new credentials
- [ ] Document setup process for team

### Before Each Commit
- [ ] Run `git status` to check staged files
- [ ] Ensure no `.env` files are staged
- [ ] Review diff for hardcoded secrets
- [ ] Run pre-commit hook (if configured)

### Production Deployment
- [ ] Use environment variables (not .env files)
- [ ] Enable security headers
- [ ] Use HTTPS only
- [ ] Enable 2FA on all services
- [ ] Setup monitoring and alerts
- [ ] Document credential locations

### Regular Maintenance
- [ ] Rotate credentials per schedule
- [ ] Review access logs monthly
- [ ] Update dependencies regularly
- [ ] Audit team access quarterly
- [ ] Test incident response plan

---

## Resources

### Official Documentation
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [12 Factor App: Config](https://12factor.net/config)

### Tools
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
- [Gitleaks](https://github.com/gitleaks/gitleaks)

### Services
- [Doppler](https://doppler.com/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [GitGuardian](https://www.gitguardian.com/)

---

## Questions?

If you have questions about security practices or need help with credential management, please:
1. Review this document thoroughly
2. Check the official documentation links
3. Consult with the security team
4. Create an issue in the repository (without including sensitive information)

**Remember: When in doubt, don't commit it!**
