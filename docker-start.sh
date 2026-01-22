#!/bin/bash

# BOOKMATE Docker Startup Script
# This script helps you start the application with Docker

set -e

echo "=========================================="
echo "  BOOKMATE Docker Startup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed.${NC}"
    exit 1
fi

# Function to check .env file
check_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Warning: .env file not found.${NC}"
        echo "Creating .env from .env.example if it exists..."
        if [ -f .env.example ]; then
            cp .env.example .env
            echo -e "${GREEN}Created .env file. Please edit it with your configuration.${NC}"
        else
            echo -e "${RED}Error: .env.example not found. Please create .env file manually.${NC}"
            exit 1
        fi
    fi
}

# Function to start development
start_dev() {
    echo -e "${BLUE}Starting development environment...${NC}"
    echo ""
    
    check_env
    
    echo "Building and starting containers..."
    docker-compose -f docker-compose.dev.yml up -d --build
    
    echo ""
    echo -e "${GREEN}Development environment started!${NC}"
    echo ""
    echo "Services:"
    echo "  - API: http://localhost:3000"
    echo "  - API Docs: http://localhost:3000/api-docs"
    echo "  - Health: http://localhost:3000/health"
    echo ""
    echo "To view logs: docker-compose -f docker-compose.dev.yml logs -f"
    echo "To stop: docker-compose -f docker-compose.dev.yml down"
}

# Function to start production
start_prod() {
    echo -e "${BLUE}Starting production environment...${NC}"
    echo ""
    
    check_env
    
    # Check required environment variables
    if [ -z "$JWT_SECRET" ] && ! grep -q "JWT_SECRET=" .env 2>/dev/null; then
        echo -e "${YELLOW}Warning: JWT_SECRET not set in .env${NC}"
    fi
    
    if [ -z "$OPAY_MERCHANT_ID" ] && ! grep -q "OPAY_MERCHANT_ID=" .env 2>/dev/null; then
        echo -e "${YELLOW}Warning: OPay credentials not set in .env${NC}"
    fi
    
    echo "Building and starting containers..."
    docker-compose up -d --build
    
    echo ""
    echo -e "${GREEN}Production environment started!${NC}"
    echo ""
    echo "Services:"
    echo "  - API: http://localhost:3000"
    echo "  - Health: http://localhost:3000/health"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
}

# Function to stop containers
stop_containers() {
    echo -e "${BLUE}Stopping containers...${NC}"
    
    if [ -f docker-compose.dev.yml ]; then
        docker-compose -f docker-compose.dev.yml down
    fi
    
    if [ -f docker-compose.yml ]; then
        docker-compose down
    fi
    
    echo -e "${GREEN}Containers stopped.${NC}"
}

# Function to view logs
view_logs() {
    if [ "$1" == "dev" ]; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose logs -f
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}Container Status:${NC}"
    echo ""
    
    if [ -f docker-compose.dev.yml ]; then
        echo "Development:"
        docker-compose -f docker-compose.dev.yml ps
        echo ""
    fi
    
    if [ -f docker-compose.yml ]; then
        echo "Production:"
        docker-compose ps
    fi
}

# Main menu
case "${1:-}" in
    dev|development)
        start_dev
        ;;
    prod|production)
        start_prod
        ;;
    stop|down)
        stop_containers
        ;;
    logs)
        view_logs "${2:-}"
        ;;
    status|ps)
        show_status
        ;;
    *)
        echo "Usage: $0 {dev|prod|stop|logs|status}"
        echo ""
        echo "Commands:"
        echo "  dev      - Start development environment"
        echo "  prod     - Start production environment"
        echo "  stop     - Stop all containers"
        echo "  logs     - View logs (dev|prod)"
        echo "  status   - Show container status"
        echo ""
        echo "Examples:"
        echo "  $0 dev           # Start development"
        echo "  $0 prod          # Start production"
        echo "  $0 stop          # Stop all"
        echo "  $0 logs dev      # View dev logs"
        echo "  $0 status        # Show status"
        exit 1
        ;;
esac

