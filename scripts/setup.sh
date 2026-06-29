#!/bin/bash

# ===========================================
# Ecommerce Platform Setup Script
# ===========================================
set -e

# Colors for output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version 20+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) is installed"

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm -v) is installed"

    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) is not installed. Database setup may need to be done manually."
    else
        print_success "PostgreSQL client is installed"
    fi

    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis client (redis-cli) is not installed. Redis may be running in Docker."
    else
        print_success "Redis client is installed"
    fi

    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        print_success "Docker is installed"
    else
        print_warning "Docker is not installed. You can still run without Docker using local services."
    fi

    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git $(git --version | cut -d' ' -f3) is installed"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."

    # Root .env
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
            print_warning "Please edit .env with your configuration values"
        else
            print_error ".env.example not found"
        fi
    else
        print_warning ".env already exists, skipping"
    fi

    # Backend .env
    if [ ! -f backend/.env ]; then
        if [ -f backend/.env.example ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env from backend/.env.example"
        fi
    else
        print_warning "backend/.env already exists, skipping"
    fi

    # Frontend .env.local
    if [ ! -f frontend/.env.local ]; then
        if [ -f frontend/.env.example ]; then
            cp frontend/.env.example frontend/.env.local
            print_success "Created frontend/.env.local from frontend/.env.example"
        fi
    else
        print_warning "frontend/.env.local already exists, skipping"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    # Install root dependencies
    if [ -f package.json ]; then
        print_status "Installing root dependencies..."
        npm install
        print_success "Root dependencies installed"
    fi

    # Install backend dependencies
    if [ -f backend/package.json ]; then
        print_status "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        print_success "Backend dependencies installed"
    fi

    # Install frontend dependencies
    if [ -f frontend/package.json ]; then
        print_status "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."

    if [ -d backend ]; then
        cd backend

        # Check if prisma is available
        if [ -f prisma/schema.prisma ]; then
            print_status "Generating Prisma client..."
            npx prisma generate

            print_status "Running Prisma migrations..."
            npx prisma migrate deploy

            print_success "Database migrations completed"
        else
            print_warning "No Prisma schema found, skipping migrations"
        fi

        cd ..
    fi
}

# Seed database
seed_database() {
    print_status "Seeding database..."

    if [ -d backend ]; then
        cd backend

        if [ -f package.json ]; then
            # Check if seed script exists
            if npm run --silent 2>&1 | grep -q "seed"; then
                npm run seed
                print_success "Database seeded successfully"
            else
                print_warning "No seed script found in package.json"
            fi
        fi

        cd ..
    fi
}

# Build applications
build_applications() {
    print_status "Building applications..."

    # Build backend
    if [ -f backend/package.json ]; then
        print_status "Building backend..."
        cd backend
        npm run build
        cd ..
        print_success "Backend built successfully"
    fi

    # Build frontend
    if [ -f frontend/package.json ]; then
        print_status "Building frontend..."
        cd frontend
        npm run build
        cd ..
        print_success "Frontend built successfully"
    fi
}

# Start development servers
start_dev_servers() {
    print_status "Starting development servers..."

    echo ""
    echo "==========================================="
    echo "  Development servers starting..."
    echo "==========================================="
    echo ""
    echo "  Backend:  http://localhost:3001"
    echo "  Frontend: http://localhost:3000"
    echo ""
    echo "  Press Ctrl+C to stop all servers"
    echo "==========================================="
    echo ""

    # Start both servers concurrently
    if command -v concurrently &> /dev/null; then
        concurrently --names "BACKEND,FRONTEND" --prefix-colors "blue,green" \
            "cd backend && npm run start:dev" \
            "cd frontend && npm run dev"
    else
        # Fallback: start in background
        cd backend && npm run start:dev &
        BACKEND_PID=$!
        cd ../frontend && npm run dev &
        FRONTEND_PID=$!

        # Wait for either to exit
        trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
        wait
    fi
}

# Main function
main() {
    echo ""
    echo "==========================================="
    echo "  Ecommerce Platform Setup"
    echo "==========================================="
    echo ""

    check_prerequisites
    echo ""

    setup_environment
    echo ""

    install_dependencies
    echo ""

    run_migrations
    echo ""

    seed_database
    echo ""

    read -p "Do you want to build applications now? (y/N): " build_choice
    if [[ $build_choice =~ ^[Yy]$ ]]; then
        build_applications
        echo ""
    fi

    read -p "Do you want to start development servers? (y/N): " start_choice
    if [[ $start_choice =~ ^[Yy]$ ]]; then
        start_dev_servers
    else
        echo ""
        print_success "Setup completed!"
        echo ""
        echo "To start development servers later, run:"
        echo "  npm run dev"
        echo ""
        echo "Or manually:"
        echo "  cd backend && npm run start:dev"
        echo "  cd frontend && npm run dev"
        echo ""
    fi
}

# Run main function
main
