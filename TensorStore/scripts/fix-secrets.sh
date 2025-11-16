#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Fixing Secrets Configuration ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo -e "Run: ${YELLOW}./scripts/setup.sh${NC} first\n"
    exit 1
fi

# Load environment variables (using a safer method that handles special characters)
# Read values from .env file without sourcing (to avoid issues with special chars like &)
export $(grep -v '^#' .env | grep -v '^$' | xargs)

# Regenerate docker-secrets.env with current values
echo -e "${GREEN}Regenerating docker-secrets.env from .env...${NC}"
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

echo -e "${GREEN}✓ docker-secrets.env regenerated${NC}\n"

# Note about docker-compose variable substitution
echo -e "${YELLOW}Note:${NC} Docker Compose reads variables from:"
echo -e "  1. Shell environment (where docker-compose runs)"
echo -e "  2. .env file in the same directory as docker-compose.yml"
echo -e "  3. env_file section (loaded into container)\n"

echo -e "${GREEN}To ensure secrets are loaded correctly:${NC}"
echo -e "  1. Make sure .env file has real values (not placeholders)"
echo -e "  2. docker-secrets.env is generated (done above)"
echo -e "  3. When running docker-compose, it will read from .env for variable substitution"
echo -e "  4. Containers will load secrets from docker-secrets.env via env_file\n"

# Verify
echo -e "${GREEN}Verifying configuration...${NC}"
if [ -f docker-secrets.env ]; then
    if grep -q "CLERK_SECRET_KEY=" docker-secrets.env && ! grep -q "CLERK_SECRET_KEY=$" docker-secrets.env; then
        CLERK_KEY=$(grep "CLERK_SECRET_KEY=" docker-secrets.env | cut -d'=' -f2)
        if [[ "$CLERK_KEY" =~ ^sk_ ]]; then
            echo -e "${GREEN}✓${NC} CLERK_SECRET_KEY is set correctly"
        else
            echo -e "${YELLOW}⚠${NC} CLERK_SECRET_KEY may be invalid (should start with 'sk_')"
        fi
    else
        echo -e "${RED}✗${NC} CLERK_SECRET_KEY is empty in docker-secrets.env"
    fi
fi

echo -e "\n${GREEN}=== Done ===${NC}\n"
echo -e "Run ${YELLOW}./scripts/verify-secrets.sh${NC} for full verification\n"

