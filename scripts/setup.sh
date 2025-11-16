#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== TensorStore Docker Setup ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from env.example...${NC}"
    cp env.example .env
    echo -e "${GREEN}.env file created. Please edit it with your actual values.${NC}\n"
    echo -e "${RED}IMPORTANT: Edit .env file with your actual secrets before continuing!${NC}\n"
    read -p "Press Enter after you've edited .env file..."
fi

# Load environment variables
echo -e "${GREEN}Loading environment variables...${NC}"
set -a
source .env
set +a

# Validate required variables
echo -e "${GREEN}Validating required environment variables...${NC}"

REQUIRED_VARS=(
    "CLERK_SECRET_KEY"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "MONGODB_ROOT_PASSWORD"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "  - $var"
    done
    echo -e "\n${YELLOW}Please set these in your .env file${NC}"
    exit 1
fi

echo -e "${GREEN}All required variables are set.${NC}\n"

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p logs
mkdir -p data/mongodb
mkdir -p data/milvus
mkdir -p data/minio
mkdir -p data/etcd
echo -e "${GREEN}Directories created.${NC}\n"

# Build Docker images
echo -e "${GREEN}Building Docker images...${NC}\n"

echo -e "${YELLOW}Building backend image...${NC}"
docker build \
    -f docker/backend.Dockerfile \
    -t tensorstore-backend:latest \
    --build-arg PIP_EXTRA_INDEX_URL="" \
    --build-arg BUILD_VERSION="${BUILD_VERSION:-1.0.0}" \
    ./db-flask-backend

echo -e "${GREEN}Backend image built successfully.${NC}\n"

echo -e "${YELLOW}Building frontend image...${NC}"
docker build \
    -f docker/frontend.Dockerfile \
    -t tensorstore-frontend:latest \
    --build-arg NEXT_PUBLIC_FLASK_API_URL="http://backend:5000/service/api" \
    .

echo -e "${GREEN}Frontend image built successfully.${NC}\n"

# Create Docker secrets file (for docker-compose env_file)
echo -e "${GREEN}Creating Docker secrets file...${NC}"
cat > docker-secrets.env <<EOF
# MongoDB
DATABASE_URL=${DATABASE_URL:-}
MONGODB_ROOT_USERNAME=${MONGODB_ROOT_USERNAME:-admin}
MONGODB_ROOT_PASSWORD=${MONGODB_ROOT_PASSWORD:-changeme}

# Milvus
MILVUS_URI=${MILVUS_URI:-http://milvus:19530}
MILVUS_TOKEN=${MILVUS_TOKEN:-}
MILVUS_USER=${MILVUS_USER:-}

# Clerk
CLERK_SECRET_KEY=${CLERK_SECRET_KEY:-}
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}
CLERK_FRONTEND_API=${CLERK_FRONTEND_API:-https://api.clerk.com}
CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK_SECRET:-}

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL:-/sign-in}
NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL:-/sign-up}
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:-/}
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:-/}

# Application
ENVIRONMENT=${ENVIRONMENT:-development}
BUILD_VERSION=${BUILD_VERSION:-1.0.0}

# MinIO
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
EOF

echo -e "${GREEN}Docker secrets file created (docker-secrets.env).${NC}\n"

# Validate Docker Compose file
echo -e "${GREEN}Validating docker-compose.yml...${NC}"
docker-compose config > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}docker-compose.yml is valid.${NC}\n"
else
    echo -e "${RED}Error: docker-compose.yml validation failed${NC}"
    exit 1
fi

# Pull required images
echo -e "${GREEN}Pulling required base images...${NC}"
docker-compose pull mongodb milvus etcd minio 2>/dev/null || true
echo -e "${GREEN}Base images ready.${NC}\n"

# Verify secrets
echo -e "${GREEN}Verifying secrets configuration...${NC}"
if [ -f .env ]; then
    if grep -q "CLERK_SECRET_KEY=sk_test_\.\.\." .env || grep -q "CLERK_SECRET_KEY=$" .env; then
        echo -e "${YELLOW}⚠${NC} CLERK_SECRET_KEY appears to have placeholder value"
        echo -e "   ${YELLOW}Please edit .env file with your actual Clerk secret key${NC}\n"
    fi
    if grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_\.\.\." .env || grep -q "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$" .env; then
        echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY appears to have placeholder value"
        echo -e "   ${YELLOW}Please edit .env file with your actual Clerk publishable key${NC}\n"
    fi
    if grep -q "MONGODB_ROOT_PASSWORD=changeme" .env; then
        echo -e "${YELLOW}⚠${NC} MONGODB_ROOT_PASSWORD is using default 'changeme'"
        echo -e "   ${YELLOW}Recommendation: Change to a strong password${NC}\n"
    fi
fi

# Summary
echo -e "${GREEN}=== Setup Complete ===${NC}\n"
echo -e "Everything is ready! Next steps:"
echo -e "  1. ${YELLOW}Edit .env file${NC} with your actual secrets (if not done already)"
echo -e "  2. ${YELLOW}Run ./scripts/verify-secrets.sh${NC} to verify configuration"
echo -e "  3. ${YELLOW}Start services${NC} when ready:\n"
echo -e "     ${YELLOW}./scripts/start.sh${NC}        # Start with health checks"
echo -e "     ${YELLOW}docker-compose up -d${NC}     # Or start directly\n"
echo -e "To view logs:"
echo -e "  ${YELLOW}docker-compose logs -f${NC}    # All services"
echo -e "  ${YELLOW}docker-compose logs -f backend${NC}  # Backend only"
echo -e "  ${YELLOW}docker-compose logs -f frontend${NC} # Frontend only\n"
echo -e "To stop services:"
echo -e "  ${YELLOW}docker-compose down${NC}       # Stop and remove containers\n"
echo -e "Services will be available at:"
echo -e "  ${GREEN}Frontend:${NC} http://localhost:3000"
echo -e "  ${GREEN}Backend:${NC}  http://localhost:5000/service/api\n"

