#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== TensorStore Environment Check ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}✗${NC} .env file not found"
    echo -e "  Run: ${YELLOW}cp env.example .env${NC} and configure it\n"
else
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Load and check variables
    set -a
    source .env
    set +a
    
    # Check required variables
    MISSING=0
    
    if [ -z "$CLERK_SECRET_KEY" ] || [ "$CLERK_SECRET_KEY" = "sk_test_..." ]; then
        echo -e "${RED}✗${NC} CLERK_SECRET_KEY not set or using placeholder"
        MISSING=1
    else
        echo -e "${GREEN}✓${NC} CLERK_SECRET_KEY is set"
    fi
    
    if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" = "pk_test_..." ]; then
        echo -e "${RED}✗${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set or using placeholder"
        MISSING=1
    else
        echo -e "${GREEN}✓${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set"
    fi
    
    if [ -z "$MONGODB_ROOT_PASSWORD" ] || [ "$MONGODB_ROOT_PASSWORD" = "changeme" ]; then
        echo -e "${YELLOW}⚠${NC} MONGODB_ROOT_PASSWORD is using default value (not secure for production)"
    else
        echo -e "${GREEN}✓${NC} MONGODB_ROOT_PASSWORD is set"
    fi
    
    echo ""
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    if docker info &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker daemon is running"
    else
        echo -e "${RED}✗${NC} Docker daemon is not running"
        echo -e "  Start Docker Desktop or docker daemon\n"
    fi
else
    echo -e "${RED}✗${NC} Docker is not installed"
    echo ""
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose is available"
else
    echo -e "${RED}✗${NC} Docker Compose is not available"
    echo ""
fi

# Check if images are built
echo -e "\n${GREEN}Checking Docker images...${NC}"
if docker image inspect tensorstore-backend:latest &> /dev/null; then
    echo -e "${GREEN}✓${NC} Backend image exists"
else
    echo -e "${YELLOW}⚠${NC} Backend image not built (will be built on first run)"
fi

if docker image inspect tensorstore-frontend:latest &> /dev/null; then
    echo -e "${GREEN}✓${NC} Frontend image exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend image not built (will be built on first run)"
fi

# Check if services are running
echo -e "\n${GREEN}Checking running services...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Some services are running"
    docker-compose ps
else
    echo -e "${YELLOW}⚠${NC} No services are currently running"
fi

echo -e "\n${GREEN}=== Check Complete ===${NC}\n"

if [ "$MISSING" -eq 1 ]; then
    echo -e "${YELLOW}Please configure missing environment variables in .env file${NC}\n"
    exit 1
fi

