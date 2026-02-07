@echo off
REM ==========================================
REM Git Hooks Setup Script (Windows)
REM ==========================================
REM This script installs git hooks to prevent
REM committing sensitive files and credentials
REM ==========================================

echo Setting up Git security hooks...
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo Error: Not a git repository
    echo Please run this script from the root of your git repository
    exit /b 1
)

REM Create hooks directory if it doesn't exist
if not exist ".git\hooks" mkdir ".git\hooks"

REM ==========================================
REM Pre-commit Hook
REM ==========================================
echo Installing pre-commit hook...

(
echo #!/bin/bash
echo.
echo # Pre-commit Hook - Prevent Sensitive Files
echo.
echo RED='\033[0;31m'
echo YELLOW='\033[1;33m'
echo NC='\033[0m'
echo.
echo # Check for sensitive files
echo SENSITIVE_FILES=$^(git diff --cached --name-only ^| grep -E '\.\(env^|env\..*\)$^|\.key$^|\.pem$^|\.keystore$^|\.jks$^|\.p12$^|\.pfx$'^)
echo.
echo if [ ! -z "$SENSITIVE_FILES" ]; then
echo     echo -e "${RED}ERROR: Attempting to commit sensitive files!${NC}"
echo     echo "Files detected:"
echo     echo "$SENSITIVE_FILES"
echo     echo ""
echo     echo "These files should NOT be committed to version control."
echo     echo "To fix: git reset HEAD <file>"
echo     exit 1
echo fi
echo.
echo exit 0
) > .git\hooks\pre-commit

echo Pre-commit hook installed
echo.

REM ==========================================
REM Pre-push Hook
REM ==========================================
echo Installing pre-push hook...

(
echo #!/bin/bash
echo.
echo # Pre-push Hook - Final Security Check
echo.
echo RED='\033[0;31m'
echo GREEN='\033[0;32m'
echo NC='\033[0m'
echo.
echo echo "Running pre-push security checks..."
echo.
echo # Check if any .env files exist in the repository
echo ENV_FILES=$^(git ls-files ^| grep -E '\.\(env^|env\..*\)$' ^| grep -v '\.example$' ^| grep -v '\.template$'^)
echo.
echo if [ ! -z "$ENV_FILES" ]; then
echo     echo -e "${RED}ERROR: Environment files found in repository!${NC}"
echo     echo "Files found:"
echo     echo "$ENV_FILES"
echo     echo ""
echo     echo "These files should be removed from git history."
echo     exit 1
echo fi
echo.
echo echo -e "${GREEN}Security checks passed${NC}"
echo exit 0
) > .git\hooks\pre-push

echo Pre-push hook installed
echo.

REM ==========================================
REM Summary
REM ==========================================
echo ========================================
echo Git security hooks installed successfully!
echo ========================================
echo.
echo Installed hooks:
echo   - pre-commit  : Prevents committing sensitive files
echo   - pre-push    : Final security check before push
echo.
echo These hooks will help prevent accidental credential leaks.
echo.
echo Note: Hooks are local to your repository.
echo Each team member should run this script after cloning.
echo.

pause
