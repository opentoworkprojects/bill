#!/bin/bash

# RestoBill AI - Render Build Script
# This script prepares the application for Render deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
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

# Main build function
main() {
    echo ""
    echo "🍽️  RestoBill AI - Render Build Script"
    echo "====================================="
    echo ""

    # Detect build context
    if [ -f "package.json" ]; then
        print_status "Building React frontend..."
        build_frontend
    elif [ -f "requirements.txt" ]; then
        print_status "Building Python backend..."
        build_backend
    elif [ -f "frontend/package.json" ] && [ -f "backend/requirements.txt" ]; then
        print_status "Building full stack application..."
        build_fullstack
    else
        print_error "Unable to detect application type"
        exit 1
    fi

    print_success "Build completed successfully!"
}

# Build frontend
build_frontend() {
    print_status "Installing Node.js dependencies..."

    # Use npm with legacy peer deps to handle React conflicts
    npm install --legacy-peer-deps --production=false

    print_status "Running frontend build..."

    # Set CI=false to treat warnings as warnings, not errors
    CI=false npm run build

    print_success "Frontend build completed"

    # Verify build directory exists
    if [ ! -d "build" ]; then
        print_error "Build directory not found!"
        exit 1
    fi

    print_status "Build output:"
    ls -la build/
}

# Build backend
build_backend() {
    print_status "Installing Python dependencies..."

    # Upgrade pip first
    python -m pip install --upgrade pip

    # Install requirements
    pip install -r requirements.txt --no-cache-dir

    print_status "Creating necessary directories..."
    mkdir -p logs uploads backups

    # Create .env from template if it doesn't exist
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Created .env from template - configure environment variables"
    fi

    print_status "Running Python syntax check..."
    python -m py_compile server.py main.py

    print_success "Backend build completed"
}

# Build full stack
build_fullstack() {
    # Build backend first
    if [ -d "backend" ]; then
        print_status "Building backend..."
        cd backend
        build_backend
        cd ..
    fi

    # Build frontend
    if [ -d "frontend" ]; then
        print_status "Building frontend..."
        cd frontend
        build_frontend
        cd ..
    fi
}

# Error handling
trap 'print_error "Build failed at line $LINENO"' ERR

# Run main function
main "$@"
