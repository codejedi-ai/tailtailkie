#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Stopping TensorStore Services ===${NC}\n"

docker-compose down

echo -e "\n${GREEN}All services stopped.${NC}\n"

