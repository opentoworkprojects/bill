#!/bin/bash

# ==========================================
# Git Hooks Setup Script
# ==========================================
# This script installs git hooks to prevent
# committing sensitive files and credentials
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Git security hooks...${NC}"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository${NC}"
    echo "Please run this script from the root of your git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# ==========================================
# Pre-commit Hook
# ==========================================
echo -e "${YELLOW}Installing pre-commit hook...${NC}"

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# ==========================================
# Pre-commit Hook - Prevent Sensitive Files
# ==========================================

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for sensitive files
SENSITIVE_FILES=$(git diff --cached --name-only | grep -E '\.(env|env\..*)$|\.key$|\.pem$|\.keystore$|\.jks$|\.p12$|\.pfx$')

if [ ! -z "$SENSITIVE_FILES" ]; then
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ERROR: Attempting to commit sensitive files!         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Files detected:${NC}"
    echo "$SENSITIVE_FILES" | sed 's/^/  ❌ /'
    echo ""
    echo "These files should NOT be committed to version control."
    echo ""
    echo "To fix this:"
    echo "  1. Unstage the files: git reset HEAD <file>"
    echo "  2. Add them to .gitignore"
    echo "  3. Ensure they contain no sensitive data before committing"
    echo ""
    exit 1
fi

# Check for potential secrets in staged content
SECRETS_FOUND=false

# Check for common secret patterns
if git diff --cached | grep -qE 'mongodb\+srv://[^:]+:[^@]+@'; then
    echo -e "${RED}⚠️  WARNING: MongoDB connection string detected!${NC}"
    SECRETS_FOUND=true
fi

if git diff --cached | grep -qE 'redis://[^:]+:[^@]+@'; then
    echo -e "${RED}⚠️  WARNING: Redis connection string detected!${NC}"
    SECRETS_FOUND=true
fi

if git diff --cached | grep -qE 'sk-[A-Za-z0-9]{32,}'; then
    echo -e "${RED}⚠️  WARNING: OpenAI API key pattern detected!${NC}"
    SECRETS_FOUND=true
fi

if git diff --cached | grep -qE 're_[A-Za-z0-9]{32,}'; then
    echo -e "${RED}⚠️  WARNING: Resend API key pattern detected!${NC}"
    SECRETS_FOUND=true
fi

if git diff --cached | grep -qE 'AIza[A-Za-z0-9_-]{35}'; then
    echo -e "${RED}⚠️  WARNING: Google API key pattern detected!${NC}"
    SECRETS_FOUND=true
fi

if git diff --cached | grep -qE 'AC[a-z0-9]{32}'; then
    echo -e "${RED}⚠️  WARNING: Twilio Account SID pattern detected!${NC}"
    SECRETS_FOUND=true
fi

# Exclude template files from secret detection
if git diff --cached --name-only | grep -qE '\.template$|\.example$'; then
    SECRETS_FOUND=false
fi

if [ "$SECRETS_FOUND" = true ]; then
    echo ""
    echo -e "${YELLOW}Potential secrets detected in your changes!${NC}"
    echo ""
    echo "Please review your changes carefully:"
    echo "  • Are you committing actual credentials?"
    echo "  • Should these be in environment variables instead?"
    echo "  • Are you updating a .template or .example file? (OK)"
    echo ""
    read -p "Continue with commit? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Commit aborted.${NC}"
        exit 1
    fi
fi

# Success
exit 0
EOF

chmod +x .git/hooks/pre-commit
echo -e "${GREEN}✓ Pre-commit hook installed${NC}"

# ==========================================
# Pre-push Hook
# ==========================================
echo -e "${YELLOW}Installing pre-push hook...${NC}"

cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# ==========================================
# Pre-push Hook - Final Security Check
# ==========================================

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running pre-push security checks...${NC}"

# Check if any .env files exist in the repository
ENV_FILES=$(git ls-files | grep -E '\.(env|env\..*)$' | grep -v '\.example$' | grep -v '\.template$')

if [ ! -z "$ENV_FILES" ]; then
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ERROR: Environment files found in repository!        ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Files found:${NC}"
    echo "$ENV_FILES" | sed 's/^/  ❌ /'
    echo ""
    echo "These files should be removed from git history."
    echo ""
    echo "To fix this:"
    echo "  1. Remove files from git: git rm --cached <file>"
    echo "  2. Add to .gitignore"
    echo "  3. Commit the removal"
    echo ""
    echo "To remove from history, see: SECURITY_REMEDIATION_URGENT.md"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Security checks passed${NC}"
exit 0
EOF

chmod +x .git/hooks/pre-push
echo -e "${GREEN}✓ Pre-push hook installed${NC}"

# ==========================================
# Summary
# ==========================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Git security hooks installed successfully!           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Installed hooks:"
echo "  ✓ pre-commit  - Prevents committing sensitive files"
echo "  ✓ pre-push    - Final security check before push"
echo ""
echo "These hooks will help prevent accidental credential leaks."
echo ""
echo -e "${YELLOW}Note: Hooks are local to your repository.${NC}"
echo "Each team member should run this script after cloning."
echo ""
