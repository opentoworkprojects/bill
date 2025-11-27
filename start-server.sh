#!/bin/bash

# RestoBill AI - Simple Server Startup Script
# Quick and easy way to start the server in production

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🍽️  Starting RestoBill AI Server...${NC}"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "backend/server.py" ]; then
    echo -e "${RED}Error: Please run this script from the restro-ai root directory${NC}"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}Creating .env file from template...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration before running again!${NC}"
        exit 1
    else
        echo -e "${RED}Error: No .env file found. Please create one with your configuration.${NC}"
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Create necessary directories
mkdir -p logs uploads backups

# Start the server
echo ""
echo -e "${GREEN}🚀 Starting RestoBill AI Server...${NC}"
echo -e "${GREEN}📡 API will be available at: http://localhost:5000${NC}"
echo -e "${GREEN}📋 API Documentation: http://localhost:5000/docs${NC}"
echo -e "${GREEN}❤️  Health Check: http://localhost:5000/health${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the server
python main.py
