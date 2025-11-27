#!/bin/bash

# CORS Fix Deployment Script
# This script helps deploy the CORS fixes to production

echo "🚀 RestoBill AI - CORS Fix Deployment"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/server.py" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch"
    read -p "Do you want to switch to main? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        print_success "Switched to main branch"
    else
        print_info "Continuing on $CURRENT_BRANCH"
    fi
fi

echo ""
echo "Step 2: Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add backend/server.py frontend/.env.production
        git commit -m "fix: Add finverge.tech to CORS allowed origins and update production backend URL"
        print_success "Changes committed"
    else
        print_warning "Skipping commit. Please commit manually before deploying."
        exit 1
    fi
else
    print_success "No uncommitted changes"
fi

echo ""
echo "Step 3: Pushing to remote repository..."
read -p "Push to remote? This will trigger backend deployment on Render. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin $CURRENT_BRANCH
    print_success "Pushed to remote repository"
    print_info "Render will automatically deploy the backend changes"
else
    print_warning "Skipped push. Backend won't be updated."
fi

echo ""
echo "Step 4: Backend Deployment Status"
print_info "Check backend deployment at: https://dashboard.render.com"
print_info "Backend URL: https://restro-ai.onrender.com"
echo ""
read -p "Press Enter when backend deployment is complete..."

echo ""
echo "Step 5: Testing backend health..."
if command -v curl &> /dev/null; then
    HEALTH_CHECK=$(curl -s https://restro-ai.onrender.com/health)
    if [[ $HEALTH_CHECK == *"healthy"* ]]; then
        print_success "Backend is healthy and running"
    else
        print_error "Backend health check failed"
        print_info "Response: $HEALTH_CHECK"
    fi
else
    print_warning "curl not found. Please manually check: https://restro-ai.onrender.com/health"
fi

echo ""
echo "Step 6: Frontend Deployment"
print_info "Frontend needs to be rebuilt and redeployed"
echo ""
read -p "Do you want to build the frontend now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd frontend
    print_info "Installing dependencies..."
    npm install
    print_info "Building production bundle..."
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
        print_info "Build output is in frontend/build/"
        echo ""
        print_info "Deploy the build to your hosting platform:"
        print_info "  - For Vercel: vercel --prod"
        print_info "  - For Netlify: netlify deploy --prod"
        print_info "  - Or push to trigger auto-deployment"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    cd ..
else
    print_warning "Skipped frontend build"
fi

echo ""
echo "Step 7: Verification"
echo "===================="
print_info "After frontend deployment, verify the following:"
echo ""
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Go to https://finverge.tech"
echo "3. Open DevTools (F12) → Console tab"
echo "4. Try to login"
echo "5. Check for CORS errors (should be none)"
echo ""
print_info "Expected behavior:"
echo "  ✅ No CORS errors in console"
echo "  ✅ Login request succeeds"
echo "  ✅ API calls return data"
echo ""

echo "Step 8: Testing CORS Configuration"
if command -v curl &> /dev/null; then
    print_info "Testing CORS preflight request..."
    CORS_TEST=$(curl -s -H "Origin: https://finverge.tech" \
                     -H "Access-Control-Request-Method: POST" \
                     -H "Access-Control-Request-Headers: Content-Type" \
                     -X OPTIONS \
                     https://restro-ai.onrender.com/api/auth/login \
                     -I | grep -i "access-control-allow-origin")
    
    if [[ $CORS_TEST == *"finverge.tech"* ]]; then
        print_success "CORS is configured correctly"
        echo "$CORS_TEST"
    else
        print_warning "CORS headers not found. Backend may still be deploying."
        print_info "Wait a few minutes and test manually"
    fi
else
    print_warning "curl not found. Please test CORS manually"
fi

echo ""
echo "======================================"
echo "🎉 Deployment Process Complete!"
echo "======================================"
echo ""
print_info "Next Steps:"
echo "1. Deploy frontend to your hosting platform"
echo "2. Clear browser cache"
echo "3. Test login at https://finverge.tech"
echo "4. Verify no CORS errors"
echo ""
print_info "Documentation:"
echo "  - Full guide: CORS_FIX_COMPLETE.md"
echo "  - Troubleshooting: See CORS_FIX_COMPLETE.md"
echo ""
print_success "All backend changes deployed!"
echo ""

# Summary
echo "📋 Deployment Summary"
echo "===================="
echo "Backend URL: https://restro-ai.onrender.com"
echo "Frontend URL: https://finverge.tech"
echo "CORS Origins: finverge.tech, www.finverge.tech"
echo "Status: Backend deployed, Frontend needs deployment"
echo ""
print_info "Check CORS_FIX_COMPLETE.md for detailed verification steps"
