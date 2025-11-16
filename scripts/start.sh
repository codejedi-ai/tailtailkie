#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting TensorStore Services ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Error: .env file not found.${NC}"
    echo -e "Please run: ${GREEN}./scripts/setup.sh${NC} first"
    exit 1
fi

# Check if images exist
if ! docker image inspect tensorstore-backend:latest > /dev/null 2>&1; then
    echo -e "${YELLOW}Backend image not found. Building...${NC}"
    ./scripts/setup.sh
fi

if ! docker image inspect tensorstore-frontend:latest > /dev/null 2>&1; then
    echo -e "${YELLOW}Frontend image not found. Building...${NC}"
    ./scripts/setup.sh
fi

# Load environment variables
set -a
source .env
set +a

# Start services
echo -e "${GREEN}Starting all services...${NC}\n"
docker-compose up -d

# Wait for services to be healthy
echo -e "\n${GREEN}Waiting for services to be ready...${NC}"
sleep 5

# Check service health
echo -e "\n${GREEN}Checking service health...${NC}"

# Wait for MongoDB
echo -n "Waiting for MongoDB..."
until docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✓${NC}"

# Wait for Backend
echo -n "Waiting for Backend..."
until curl -f http://localhost:5000/service/api/status > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✓${NC}"

# Wait for Frontend
echo -n "Waiting for Frontend..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo -e " ${GREEN}✓${NC}"

echo -e "\n${GREEN}=== All Services Started ===${NC}\n"
echo -e "Services are now running:"
echo -e "  ${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "  ${GREEN}Backend:${NC}  http://localhost:5000/service/api\n"
echo -e "View logs with: ${YELLOW}docker-compose logs -f${NC}"
echo -e "Stop services with: ${YELLOW}docker-compose down${NC}\n"

