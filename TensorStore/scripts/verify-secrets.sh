#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Verifying Secrets Configuration ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}✗${NC} .env file not found"
    echo -e "  Run: ${YELLOW}./scripts/setup.sh${NC} to create it from env.example\n"
    exit 1
fi

echo -e "${GREEN}✓${NC} .env file exists\n"

# Load environment variables
set -a
source .env
set +a

# Check required secrets
echo -e "${GREEN}Checking required secrets...${NC}\n"

ERRORS=0

# MongoDB
if [ -z "$MONGODB_ROOT_PASSWORD" ] || [ "$MONGODB_ROOT_PASSWORD" = "changeme" ]; then
    echo -e "${YELLOW}⚠${NC} MONGODB_ROOT_PASSWORD is using default value 'changeme'"
    echo -e "   ${YELLOW}Recommendation:${NC} Change this to a strong password for production\n"
else
    echo -e "${GREEN}✓${NC} MONGODB_ROOT_PASSWORD is set (${#MONGODB_ROOT_PASSWORD} characters)\n"
fi

# Clerk Secret Key
if [ -z "$CLERK_SECRET_KEY" ] || [ "$CLERK_SECRET_KEY" = "sk_test_..." ] || [[ ! "$CLERK_SECRET_KEY" =~ ^sk_ ]]; then
    echo -e "${RED}✗${NC} CLERK_SECRET_KEY is not set or invalid"
    echo -e "   ${YELLOW}Required:${NC} Must start with 'sk_test_' or 'sk_live_'\n"
    ERRORS=1
else
    echo -e "${GREEN}✓${NC} CLERK_SECRET_KEY is set (starts with ${CLERK_SECRET_KEY:0:7}...)\n"
fi

# Clerk Publishable Key
if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] || [ "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" = "pk_test_..." ] || [[ ! "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" =~ ^pk_ ]]; then
    echo -e "${RED}✗${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set or invalid"
    echo -e "   ${YELLOW}Required:${NC} Must start with 'pk_test_' or 'pk_live_'\n"
    ERRORS=1
else
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set (starts with ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:7}...)\n"
fi

# Milvus (optional but recommended)
if [ -z "$MILVUS_TOKEN" ]; then
    echo -e "${YELLOW}⚠${NC} MILVUS_TOKEN is not set (optional if using local Milvus)\n"
else
    echo -e "${GREEN}✓${NC} MILVUS_TOKEN is set\n"
fi

# Check docker-secrets.env
echo -e "${GREEN}Checking docker-secrets.env...${NC}\n"

if [ ! -f docker-secrets.env ]; then
    echo -e "${YELLOW}⚠${NC} docker-secrets.env not found"
    echo -e "   ${YELLOW}Action:${NC} Run ${GREEN}./scripts/setup.sh${NC} to generate it\n"
else
    echo -e "${GREEN}✓${NC} docker-secrets.env exists\n"
    
    # Verify secrets are in docker-secrets.env
    if grep -q "CLERK_SECRET_KEY=" docker-secrets.env && ! grep -q "CLERK_SECRET_KEY=sk_test_\.\.\." docker-secrets.env; then
        echo -e "${GREEN}✓${NC} CLERK_SECRET_KEY found in docker-secrets.env\n"
    else
        echo -e "${RED}✗${NC} CLERK_SECRET_KEY missing or has placeholder in docker-secrets.env\n"
        ERRORS=1
    fi
fi

# Summary
echo -e "${GREEN}=== Summary ===${NC}\n"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All required secrets are configured!${NC}\n"
    echo -e "You can now start services with:"
    echo -e "  ${YELLOW}./scripts/start.sh${NC}\n"
    exit 0
else
    echo -e "${RED}✗ Some secrets are missing or invalid${NC}\n"
    echo -e "Please edit ${YELLOW}.env${NC} file and set:"
    echo -e "  - CLERK_SECRET_KEY (required)"
    echo -e "  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (required)"
    echo -e "  - MONGODB_ROOT_PASSWORD (recommended to change from 'changeme')\n"
    echo -e "Then run: ${YELLOW}./scripts/setup.sh${NC} to regenerate docker-secrets.env\n"
    exit 1
fi

