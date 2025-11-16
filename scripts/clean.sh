#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}=== Cleaning TensorStore Docker Environment ===${NC}\n"

read -p "This will remove all containers, volumes, and images. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Stopping and removing containers...${NC}"
docker-compose down -v

echo -e "\n${YELLOW}Removing images...${NC}"
docker rmi tensorstore-backend:latest tensorstore-frontend:latest 2>/dev/null || true

echo -e "\n${YELLOW}Removing generated files...${NC}"
rm -f docker-secrets.env

echo -e "\n${GREEN}Cleanup complete.${NC}\n"
echo -e "Note: .env file and data volumes were preserved."
echo -e "To remove data volumes, run: ${YELLOW}docker volume prune${NC}\n"

