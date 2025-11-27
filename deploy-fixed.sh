#!/bin/bash

# RestoBill AI - Fixed Deployment Script
# This script validates MongoDB connection and deploys the fixed version

set -e  # Exit on any error

echo "🚀 RestoBill AI - Fixed Deployment Script"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/server.py" ]; then
    print_error "Please run this script from the restro-ai root directory"
    exit 1
fi

# Step 1: Environment validation
print_status "Step 1: Validating environment variables..."

required_vars=("MONGO_URL" "DB_NAME" "JWT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_warning "Missing environment variables: ${missing_vars[*]}"
    print_status "You can set them in your .env file or export them:"
    for var in "${missing_vars[@]}"; do
        echo "  export $var=\"your_value_here\""
    done
    echo ""
fi

# Step 2: MongoDB Connection Test
print_status "Step 2: Testing MongoDB connection..."

cd backend

if [ -f "test_mongo_connection.py" ]; then
    print_status "Running MongoDB connection test..."

    if python test_mongo_connection.py; then
        print_success "MongoDB connection test completed"
    else
        print_warning "MongoDB connection test had issues - check the output above"
        echo "Continue with deployment? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled"
            exit 1
        fi
    fi
else
    print_warning "MongoDB connection test script not found"
fi

cd ..

# Step 3: Check for common deployment issues
print_status "Step 3: Checking for common deployment issues..."

# Check if requirements.txt exists and has motor
if [ -f "backend/requirements.txt" ]; then
    if grep -q "motor" backend/requirements.txt; then
        print_success "Motor MongoDB driver found in requirements.txt"
    else
        print_error "Motor MongoDB driver not found in requirements.txt"
        exit 1
    fi
else
    print_error "requirements.txt not found in backend directory"
    exit 1
fi

# Check if main.py exists
if [ -f "backend/main.py" ]; then
    print_success "main.py found - ready for deployment"
else
    print_error "main.py not found in backend directory"
    exit 1
fi

# Check Dockerfile
if [ -f "backend/Dockerfile.render" ]; then
    print_success "Render Dockerfile found"
elif [ -f "backend/Dockerfile" ]; then
    print_success "Standard Dockerfile found"
else
    print_warning "No Dockerfile found - using Render's auto-detect"
fi

# Step 4: Git operations
print_status "Step 4: Preparing Git repository..."

# Check if we have uncommitted changes
if ! git diff --quiet; then
    print_status "Found uncommitted changes. Committing fixes..."
    git add .
    git commit -m "Fix: MongoDB connection issues for Render deployment

- Remove invalid ssl_cert_reqs option
- Fix UnboundLocalError in startup validation
- Add proper TLS/SSL configuration for MongoDB Atlas
- Improve connection fallback strategy
- Add MongoDB connection test script

Fixes SSL handshake failures and deployment issues on Render."
    print_success "Changes committed"
else
    print_status "No uncommitted changes found"
fi

# Step 5: Deployment options
print_status "Step 5: Choose deployment method..."

echo "Available deployment options:"
echo "1) Push to Git (manual Render deployment)"
echo "2) Deploy via Render CLI (if installed)"
echo "3) Show deployment checklist only"
echo "4) Exit"

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_status "Pushing to Git repository..."

        # Get current branch
        current_branch=$(git rev-parse --abbrev-ref HEAD)
        print_status "Current branch: $current_branch"

        # Push to remote
        if git push origin "$current_branch"; then
            print_success "Code pushed to Git successfully!"
            print_status "🔗 Now go to your Render dashboard to trigger deployment"
            print_status "📝 Monitor the deployment logs for the success messages listed below"
        else
            print_error "Failed to push to Git"
            exit 1
        fi
        ;;

    2)
        print_status "Checking for Render CLI..."
        if command -v render &> /dev/null; then
            print_status "Deploying via Render CLI..."
            render deploy
        else
            print_error "Render CLI not installed. Install with:"
            echo "  npm install -g @render/cli"
            print_status "Or use option 1 to push to Git instead"
            exit 1
        fi
        ;;

    3)
        print_status "Deployment checklist mode - no deployment performed"
        ;;

    4)
        print_status "Exiting without deployment"
        exit 0
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Step 6: Post-deployment checklist
print_status "Step 6: Post-deployment checklist"
echo ""
echo "📋 DEPLOYMENT CHECKLIST"
echo "======================="
echo ""
echo "✅ Before deployment:"
echo "   □ Set environment variables in Render dashboard:"
echo "     - MONGO_URL (with ?tls=true&tlsInsecure=true parameters)"
echo "     - DB_NAME"
echo "     - JWT_SECRET"
echo "   □ MongoDB Atlas IP whitelist includes 0.0.0.0/0"
echo "   □ Database user has readWrite permissions"
echo ""
echo "✅ After deployment, look for these SUCCESS indicators in logs:"
echo "   ✅ 'Database connected: [db_name]'"
echo "   ✅ '🍽️  RestoBill AI Server Starting...'"
echo "   ✅ '🚀 Server starting on port 10000'"
echo "   ✅ 'INFO: Uvicorn running on http://0.0.0.0:10000'"
echo ""
echo "❌ If you see these ERROR indicators:"
echo "   ❌ 'MongoDB client creation failed: Unknown option ssl_cert_reqs'"
echo "   ❌ 'SSL handshake failed' or 'TLSV1_ALERT_INTERNAL_ERROR'"
echo "   ❌ 'UnboundLocalError: cannot access local variable'"
echo ""
echo "   Then the fixes weren't applied correctly. Check:"
echo "   1. Ensure you're deploying the latest commit"
echo "   2. Verify MongoDB connection string format"
echo "   3. Check MongoDB Atlas network access settings"
echo ""
echo "🔗 USEFUL ENDPOINTS TO TEST:"
echo "   - Health check: https://your-app.onrender.com/api/health"
echo "   - API docs: https://your-app.onrender.com/docs"
echo ""
echo "📚 TROUBLESHOOTING:"
echo "   - See MONGODB_CONNECTION_FIX.md for detailed troubleshooting"
echo "   - Run 'python backend/test_mongo_connection.py' to test locally"
echo ""

# Final status
print_success "Deployment preparation completed!"

if [ "$choice" == "1" ] || [ "$choice" == "2" ]; then
    echo ""
    print_status "🎯 NEXT STEPS:"
    echo "   1. Monitor your Render deployment logs"
    echo "   2. Test the health endpoint once deployed"
    echo "   3. Verify application functionality"
    echo ""
    print_success "🚀 Your MongoDB connection issues should now be resolved!"
fi

echo ""
echo "Happy deploying! 🍽️✨"
