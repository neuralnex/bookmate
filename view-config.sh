#!/bin/bash

# BOOKMATE Configuration Viewer
# This script displays all configuration files

echo "=========================================="
echo "  BOOKMATE Configuration Viewer"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display file with header
display_file() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
    if [ -f "$2" ]; then
        cat "$2"
    else
        echo -e "${YELLOW}File not found: $2${NC}"
    fi
    echo ""
    echo "----------------------------------------"
}

# Environment Variables
display_file "Environment Variables (.env)" ".env"

# Docker Files
display_file "Production Dockerfile" "Dockerfile"
display_file "Development Dockerfile" "Dockerfile.dev"
display_file "Production Docker Compose" "docker-compose.yml"
display_file "Development Docker Compose" "docker-compose.dev.yml"
display_file "Docker Ignore" ".dockerignore"

# CI/CD
display_file "CI/CD Pipeline" ".github/workflows/ci-cd.yml"

# Configuration Files
display_file "Environment Config (src/config/env.ts)" "src/config/env.ts"
display_file "Security Config (src/config/security.ts)" "src/config/security.ts"

# Package
display_file "Package Configuration" "package.json"

echo ""
echo -e "${GREEN}Configuration viewing complete!${NC}"
echo ""

