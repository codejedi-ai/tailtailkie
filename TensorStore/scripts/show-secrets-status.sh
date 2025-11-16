#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Secrets Configuration Status ===${NC}\n"

# Check .env file
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists\n"
    
    echo -e "${BLUE}Current .env values:${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check each secret
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        if [ -z "$value" ]; then
            echo -e "${RED}✗${NC} ${key}=${RED}(empty)${NC}"
        elif [[ "$value" =~ \.\.\.$ ]] || [[ "$value" == "changeme" ]] || [[ "$value" == "minioadmin" ]]; then
            if [[ "$key" == "MONGODB_ROOT_PASSWORD" ]] && [[ "$value" == "changeme" ]]; then
                echo -e "${YELLOW}⚠${NC} ${key}=${YELLOW}${value}${NC} (default - should change)"
            elif [[ "$key" =~ CLERK ]]; then
                echo -e "${RED}✗${NC} ${key}=${RED}${value}${NC} (placeholder - must set)"
            else
                echo -e "${YELLOW}⚠${NC} ${key}=${YELLOW}${value}${NC} (default)"
            fi
        else
            # Mask sensitive values
            if [[ "$key" =~ PASSWORD|SECRET|TOKEN|KEY ]]; then
                masked="${value:0:4}...${value: -4}"
                echo -e "${GREEN}✓${NC} ${key}=${GREEN}${masked}${NC}"
            else
                echo -e "${GREEN}✓${NC} ${key}=${GREEN}${value}${NC}"
            fi
        fi
    done < .env
    
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
else
    echo -e "${RED}✗${NC} .env file not found"
    echo -e "  Run: ${YELLOW}./scripts/setup.sh${NC} to create it\n"
fi

# Check docker-secrets.env
if [ -f docker-secrets.env ]; then
    echo -e "${GREEN}✓${NC} docker-secrets.env exists (generated from .env)\n"
else
    echo -e "${YELLOW}⚠${NC} docker-secrets.env not found"
    echo -e "  Run: ${YELLOW}./scripts/setup.sh${NC} or ${YELLOW}./scripts/fix-secrets.sh${NC} to generate it\n"
fi

# Summary
echo -e "${BLUE}=== Summary ===${NC}\n"
echo -e "Required secrets:"
echo -e "  ${GREEN}CLERK_SECRET_KEY${NC} - Must be set (starts with sk_test_ or sk_live_)"
echo -e "  ${GREEN}NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY${NC} - Must be set (starts with pk_test_ or pk_live_)"
echo -e "  ${YELLOW}MONGODB_ROOT_PASSWORD${NC} - Should change from 'changeme'\n"
echo -e "Optional secrets:"
echo -e "  ${YELLOW}MILVUS_TOKEN${NC} - Optional (for cloud Milvus)"
echo -e "  ${YELLOW}MILVUS_USER${NC} - Optional (for cloud Milvus)\n"
echo -e "To fix issues:"
echo -e "  1. Edit ${YELLOW}.env${NC} file with actual values"
echo -e "  2. Run ${YELLOW}./scripts/fix-secrets.sh${NC} to regenerate docker-secrets.env"
echo -e "  3. Run ${YELLOW}./scripts/verify-secrets.sh${NC} to verify\n"

