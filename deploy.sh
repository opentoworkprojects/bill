#!/bin/bash

# RestoBill AI - Deployment Script
# This script helps you deploy RestoBill AI server easily

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="RestoBill AI"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
DOCKER_COMPOSE_FILE="docker-compose.yml"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    local missing_deps=()

    if ! command_exists docker; then
        missing_deps+=("docker")
    fi

    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi

    if ! command_exists python3; then
        missing_deps+=("python3")
    fi

    if ! command_exists npm; then
        missing_deps+=("npm")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and run again."
        exit 1
    fi

    print_success "All prerequisites satisfied"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."

    # Create backend .env file if it doesn't exist
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            print_warning "Created .env file from template. Please edit $BACKEND_DIR/.env with your configuration."
        else
            print_error ".env.example file not found in backend directory"
            exit 1
        fi
    else
        print_success "Environment file already exists"
    fi

    # Generate random JWT secret if placeholder exists
    if grep -q "your-super-secret-jwt-key-change-this-in-production" "$BACKEND_DIR/.env"; then
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" "$BACKEND_DIR/.env"
        print_success "Generated secure JWT secret"
    fi
}

# Function to deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."

    # Check if docker-compose.yml exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi

    # Build and start services
    print_status "Building Docker images..."
    docker-compose build --no-cache

    print_status "Starting services..."
    docker-compose up -d

    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30

    # Check service health
    if docker-compose ps | grep -q "Up"; then
        print_success "Services are running!"
        echo ""
        echo "🍽️  RestoBill AI is now running!"
        echo "📱 Frontend: http://localhost:3000"
        echo "🔧 Backend API: http://localhost:5000"
        echo "💾 Database Admin: http://localhost:8081 (admin/admin123)"
        echo ""
        echo "To stop services: docker-compose down"
        echo "To view logs: docker-compose logs -f"
    else
        print_error "Some services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Function to deploy manually (without Docker)
deploy_manual() {
    print_status "Deploying manually..."

    # Check if MongoDB is running
    if ! pgrep mongod > /dev/null; then
        print_warning "MongoDB is not running. Please start MongoDB first."
        echo "Ubuntu/Debian: sudo systemctl start mongod"
        echo "macOS: brew services start mongodb/brew/mongodb-community"
        echo "Windows: net start MongoDB"
        exit 1
    fi

    # Setup backend
    print_status "Setting up backend..."
    cd "$BACKEND_DIR"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Created virtual environment"
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Install dependencies
    pip install -r requirements.txt

    # Start backend server
    print_status "Starting backend server..."
    python main.py &
    BACKEND_PID=$!

    cd ..

    # Setup frontend
    print_status "Setting up frontend..."
    cd "$FRONTEND_DIR"

    # Install dependencies
    npm install --legacy-peer-deps

    # Build and start frontend
    print_status "Building and starting frontend..."
    npm run build
    npm install -g serve
    serve -s build -l 3000 &
    FRONTEND_PID=$!

    cd ..

    # Save PIDs for cleanup
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid

    print_success "Manual deployment complete!"
    echo ""
    echo "🍽️  RestoBill AI is now running!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:5000"
    echo ""
    echo "To stop services, run: $0 stop"
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."

    if [ -f "$DOCKER_COMPOSE_FILE" ] && docker-compose ps | grep -q "Up"; then
        docker-compose down
        print_success "Docker services stopped"
    fi

    # Stop manual deployment processes
    if [ -f ".backend.pid" ]; then
        PID=$(cat .backend.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm .backend.pid
            print_success "Backend server stopped"
        fi
    fi

    if [ -f ".frontend.pid" ]; then
        PID=$(cat .frontend.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm .frontend.pid
            print_success "Frontend server stopped"
        fi
    fi
}

# Function to show status
show_status() {
    print_status "Checking service status..."

    echo ""
    echo "🐳 Docker Services:"
    if command_exists docker-compose && [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose ps
    else
        echo "Docker Compose not available or docker-compose.yml not found"
    fi

    echo ""
    echo "🔧 Manual Services:"
    if [ -f ".backend.pid" ]; then
        PID=$(cat .backend.pid)
        if kill -0 $PID 2>/dev/null; then
            echo "Backend: Running (PID: $PID)"
        else
            echo "Backend: Stopped"
            rm .backend.pid
        fi
    else
        echo "Backend: Not running"
    fi

    if [ -f ".frontend.pid" ]; then
        PID=$(cat .frontend.pid)
        if kill -0 $PID 2>/dev/null; then
            echo "Frontend: Running (PID: $PID)"
        else
            echo "Frontend: Stopped"
            rm .frontend.pid
        fi
    else
        echo "Frontend: Not running"
    fi
}

# Function to show logs
show_logs() {
    if [ -f "$DOCKER_COMPOSE_FILE" ] && docker-compose ps | grep -q "Up"; then
        docker-compose logs -f "$@"
    else
        print_warning "No Docker services running. Check manual deployment logs in backend/logs/ directory"
    fi
}

# Function to run database migrations or setup
setup_database() {
    print_status "Setting up database..."

    # You can add database initialization scripts here
    # For now, the application will create collections automatically

    print_success "Database setup complete (collections will be created automatically)"
}

# Function to backup data
backup_data() {
    print_status "Creating backup..."

    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup MongoDB
    if command_exists mongodump; then
        mongodump --host localhost:27017 --db restrobill --out "$BACKUP_DIR/"
        print_success "Database backed up to $BACKUP_DIR/"
    else
        print_warning "mongodump not found. Please install MongoDB tools for database backup."
    fi

    # Backup uploaded files
    if [ -d "$BACKEND_DIR/uploads" ]; then
        cp -r "$BACKEND_DIR/uploads" "$BACKUP_DIR/"
        print_success "Uploaded files backed up"
    fi
}

# Function to update application
update_app() {
    print_status "Updating application..."

    # Pull latest changes (if using Git)
    if [ -d ".git" ]; then
        git pull origin main
    fi

    # Rebuild and restart
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
    else
        stop_services
        setup_environment
        deploy_manual
    fi

    print_success "Application updated successfully!"
}

# Function to show help
show_help() {
    echo "RestoBill AI - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start, deploy     Deploy the application (auto-detects Docker/manual)"
    echo "  docker           Deploy using Docker"
    echo "  manual           Deploy manually without Docker"
    echo "  stop             Stop all services"
    echo "  restart          Restart all services"
    echo "  status           Show service status"
    echo "  logs [service]   Show logs (optionally for specific service)"
    echo "  setup-db         Setup database"
    echo "  backup           Create data backup"
    echo "  update           Update and restart application"
    echo "  help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start         # Start the application"
    echo "  $0 docker        # Deploy with Docker"
    echo "  $0 logs backend  # Show backend logs"
    echo "  $0 backup        # Create backup"
}

# Main script logic
main() {
    echo ""
    echo "🍽️  RestoBill AI - Deployment Manager"
    echo "=================================="
    echo ""

    case "${1:-}" in
        start|deploy)
            check_prerequisites
            setup_environment
            if [ -f "$DOCKER_COMPOSE_FILE" ] && command_exists docker-compose; then
                deploy_docker
            else
                deploy_manual
            fi
            ;;
        docker)
            check_prerequisites
            setup_environment
            deploy_docker
            ;;
        manual)
            check_prerequisites
            setup_environment
            deploy_manual
            ;;
        stop)
            stop_services
            ;;
        restart)
            stop_services
            sleep 5
            main start
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "${@:2}"
            ;;
        setup-db)
            setup_database
            ;;
        backup)
            backup_data
            ;;
        update)
            update_app
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo "Unknown command: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
