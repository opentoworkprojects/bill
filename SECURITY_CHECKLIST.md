# Security Remediation Checklist

**Date Started**: _______________  
**Completed By**: _______________  
**Date Completed**: _______________

---

## Phase 1: IMMEDIATE (Within 1 Hour) 🔴

### Credential Rotation

#### MongoDB Atlas
- [ ] Logged into https://cloud.mongodb.com/
- [ ] Navigated to Database Access
- [ ] Deleted user: `shivshankarkumar281_db_user`
- [ ] Created new user with strong password
- [ ] Copied new connection string
- [ ] Saved securely in password manager
- **New Connection String**: _______________

#### Upstash Redis
- [ ] Logged into https://console.upstash.com/
- [ ] Opened Redis database
- [ ] Regenerated REST token
- [ ] Copied new URL and token
- [ ] Saved securely in password manager
- **New URL**: _______________
- **New Token**: _______________

#### Resend Email
- [ ] Logged into https://resend.com/api-keys
- [ ] Deleted old key: `re_Mm6YAYfo_K6yhv5PVPXwMEj3SS2nuEgHm`
- [ ] Created new API key
- [ ] Copied and saved securely
- **New API Key**: _______________

#### Google Gemini
- [ ] Logged into https://makersuite.google.com/app/apikey
- [ ] Deleted old key: `AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA`
- [ ] Created new API key
- [ ] Copied and saved securely
- **New API Key**: _______________

#### Twilio
- [ ] Logged into https://console.twilio.com/
- [ ] Navigated to API keys & tokens
- [ ] Regenerated auth token
- [ ] Copied and saved securely
- **New Auth Token**: _______________

#### Admin Password
- [ ] Generated strong password (16+ characters)
- [ ] Saved securely in password manager
- **New Password**: _______________

#### JWT Secret
- [ ] Generated using: `openssl rand -base64 32`
- [ ] Saved securely
- **New JWT Secret**: _______________

### Production Update

#### Render.com (Backend)
- [ ] Logged into https://dashboard.render.com/
- [ ] Opened backend service
- [ ] Clicked "Environment" tab
- [ ] Updated `MONGO_URL` with new value
- [ ] Updated `UPSTASH_REDIS_REST_URL` with new value
- [ ] Updated `UPSTASH_REDIS_REST_TOKEN` with new value
- [ ] Updated `RESEND_API_KEY` with new value
- [ ] Updated `GEMINI_API_KEY` with new value
- [ ] Updated `TWILIO_AUTH_TOKEN` with new value
- [ ] Updated `SUPER_ADMIN_PASSWORD` with new value
- [ ] Updated `JWT_SECRET` with new value
- [ ] Clicked "Save Changes"
- [ ] Waited for automatic redeploy
- [ ] Checked deployment logs for errors

#### Vercel (Frontend)
- [ ] Logged into https://vercel.com/dashboard
- [ ] Opened project settings
- [ ] Checked environment variables
- [ ] Updated any affected variables
- [ ] Redeployed if necessary

### Application Testing
- [ ] Tested backend: `curl https://your-backend.onrender.com/health`
- [ ] Tested frontend: Opened in browser
- [ ] Checked for errors in logs
- [ ] Verified core functionality works
- [ ] Confirmed no authentication issues

### Local Environment Update

#### Backend
- [ ] Navigated to `backend/` directory
- [ ] Backed up old .env: `cp .env .env.backup`
- [ ] Copied template: `cp .env.template .env`
- [ ] Opened .env in editor
- [ ] Added new `MONGO_URL`
- [ ] Added new `UPSTASH_REDIS_REST_URL`
- [ ] Added new `UPSTASH_REDIS_REST_TOKEN`
- [ ] Added new `RESEND_API_KEY`
- [ ] Added new `GEMINI_API_KEY`
- [ ] Added new `TWILIO_AUTH_TOKEN`
- [ ] Added new `SUPER_ADMIN_PASSWORD`
- [ ] Added new `JWT_SECRET`
- [ ] Saved file
- [ ] Tested locally: `python server.py`
- [ ] Verified no errors

#### Frontend
- [ ] Navigated to `frontend/` directory
- [ ] Copied template: `cp .env.template .env.local`
- [ ] Opened .env.local in editor
- [ ] Updated `REACT_APP_BACKEND_URL`
- [ ] Updated `REACT_APP_API_URL`
- [ ] Saved file
- [ ] Tested locally: `npm start`
- [ ] Verified no errors

---

## Phase 2: URGENT (Within 24 Hours) 🟡

### Git History Cleanup

#### Preparation
- [ ] Read `START_HERE_SECURITY.md` section on git cleanup
- [ ] Chose cleanup method: [ ] BFG [ ] git-filter-repo [ ] git-filter-branch
- [ ] Notified team members about upcoming force push
- [ ] Ensured all team members pushed their work

#### Backup
- [ ] Created backup: `git clone --mirror <repo-url> restobill-backup`
- [ ] Verified backup exists
- [ ] Stored backup in safe location

#### Cleanup (Choose ONE method)

**If using BFG:**
- [ ] Downloaded BFG from https://rtyley.github.io/bfg-repo-cleaner/
- [ ] Ran: `java -jar bfg.jar --delete-files .env`
- [ ] Ran: `java -jar bfg.jar --delete-files .env.production`
- [ ] Ran: `java -jar bfg.jar --delete-files .env.local`
- [ ] Ran: `git reflog expire --expire=now --all`
- [ ] Ran: `git gc --prune=now --aggressive`

**If using git-filter-repo:**
- [ ] Installed: `pip install git-filter-repo`
- [ ] Ran: `git filter-repo --path backend/.env --invert-paths`
- [ ] Ran: `git filter-repo --path backend/.env.production --invert-paths`
- [ ] Ran: `git filter-repo --path frontend/.env --invert-paths`
- [ ] Ran: `git filter-repo --path frontend/.env.local --invert-paths`
- [ ] Re-added remote: `git remote add origin <repo-url>`

**If using git-filter-branch:**
- [ ] Ran filter-branch command (see documentation)
- [ ] Ran: `git reflog expire --expire=now --all`
- [ ] Ran: `git gc --prune=now --aggressive`

#### Force Push
- [ ] Ran: `git push --force --all`
- [ ] Ran: `git push --force --tags`
- [ ] Verified push succeeded
- [ ] Notified team members to update their repos

#### Verification
- [ ] Ran: `git ls-files | grep .env`
- [ ] Confirmed no .env files listed
- [ ] Checked GitHub/GitLab web interface
- [ ] Confirmed .env files not visible in history
- [ ] Searched for credentials in repository
- [ ] Confirmed no credentials found

### Security Hooks Installation
- [ ] Navigated to repository root
- [ ] Made script executable: `chmod +x setup-git-hooks.sh` (Linux/Mac)
- [ ] Ran: `./setup-git-hooks.sh` (Linux/Mac) or `setup-git-hooks.bat` (Windows)
- [ ] Verified hooks installed successfully
- [ ] Tested pre-commit hook by trying to commit .env file
- [ ] Confirmed hook prevented commit

### Team Notification
- [ ] Sent email/message to all team members
- [ ] Included instructions for updating their repos
- [ ] Included instructions for recreating .env files
- [ ] Included instructions for installing hooks
- [ ] Answered any questions from team

### Access Log Audit
- [ ] Checked MongoDB Atlas activity logs
- [ ] Checked Upstash Redis access logs
- [ ] Checked Resend API request logs
- [ ] Checked Google Cloud API usage
- [ ] Checked Twilio API request logs
- [ ] Looked for suspicious activity
- [ ] Documented any unusual access
- [ ] Took action if unauthorized access found

---

## Phase 3: IMPORTANT (Within 1 Week) 🟢

### 2FA Enablement
- [ ] Enabled 2FA on GitHub account
- [ ] Enabled 2FA on MongoDB Atlas
- [ ] Enabled 2FA on Upstash Redis
- [ ] Enabled 2FA on Resend
- [ ] Enabled 2FA on Google Cloud
- [ ] Enabled 2FA on Twilio
- [ ] Enabled 2FA on Render.com
- [ ] Enabled 2FA on Vercel
- [ ] Saved backup codes securely

### Credential Documentation
- [ ] Chose password manager (1Password, LastPass, Bitwarden)
- [ ] Created shared vault for team
- [ ] Documented MongoDB credentials
- [ ] Documented Redis credentials
- [ ] Documented Resend API key
- [ ] Documented Gemini API key
- [ ] Documented Twilio credentials
- [ ] Documented admin password
- [ ] Documented JWT secret
- [ ] Documented where each is used
- [ ] Documented how to rotate each
- [ ] Documented last rotation date

### Monitoring Setup
- [ ] Enabled GitHub secret scanning
- [ ] Enabled GitHub Dependabot alerts
- [ ] Setup error monitoring (Sentry/Rollbar)
- [ ] Configured alerts for failed auth
- [ ] Setup API usage monitoring
- [ ] Configured security alerts
- [ ] Tested alert system

### Team Training
- [ ] Scheduled security training session
- [ ] Prepared training materials
- [ ] Covered why credentials shouldn't be committed
- [ ] Covered how to use .env files
- [ ] Covered how to use git hooks
- [ ] Covered what to do if credentials leak
- [ ] Covered how to use password manager
- [ ] Answered team questions
- [ ] Distributed security documentation

### Secrets Management (Optional)
- [ ] Evaluated secrets management services
- [ ] Chose service: [ ] Doppler [ ] AWS [ ] Vault [ ] Other: _______
- [ ] Setup account
- [ ] Migrated credentials
- [ ] Updated deployment process
- [ ] Trained team on usage
- [ ] Documented process

---

## Phase 4: ONGOING 🔄

### Monthly Tasks
- [ ] Review access logs for all services
- [ ] Check for unusual activity
- [ ] Verify team member access is appropriate
- [ ] Review and update documentation
- [ ] Check for security updates

### Quarterly Tasks
- [ ] Rotate all credentials
- [ ] Review security practices
- [ ] Update security documentation
- [ ] Test incident response plan
- [ ] Audit team access
- [ ] Review and update .gitignore
- [ ] Check for new security tools

### Annual Tasks
- [ ] Full security audit
- [ ] Penetration testing (if applicable)
- [ ] Update security policies
- [ ] Review and update training materials
- [ ] Evaluate new security tools
- [ ] Document lessons learned

---

## Verification

### Final Checks
- [ ] No .env files in git repository
- [ ] All credentials rotated
- [ ] Production working with new credentials
- [ ] Local development working
- [ ] Security hooks installed
- [ ] Team members updated
- [ ] 2FA enabled everywhere
- [ ] Credentials documented securely
- [ ] Monitoring configured
- [ ] No unauthorized access detected

### Sign-off
- [ ] All immediate actions completed
- [ ] All urgent actions completed
- [ ] All important actions completed
- [ ] Ongoing schedule created
- [ ] Team trained
- [ ] Documentation complete

**Completed By**: _______________  
**Date**: _______________  
**Signature**: _______________

---

## Notes

Use this space to document any issues, deviations from the plan, or additional actions taken:

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

---

## Resources

- START_HERE_SECURITY.md
- SECURITY_ACTION_PLAN.md
- SECURITY_BEST_PRACTICES.md
- SECURITY_QUICK_REFERENCE.md
- SETUP_ENVIRONMENT.md

---

**Remember**: Security is everyone's responsibility! 🔒
