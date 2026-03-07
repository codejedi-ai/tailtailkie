#!/bin/bash
set -e

# Walkie-Talkie Bridge Installation Script
# Installs the bridge service on Linux systems
# Usage: curl -fsSL https://raw.githubusercontent.com/codejedi-ai/tailtailkie/main/tailscale-app/scripts/install.sh | sudo bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/codejedi-ai/tailtailkie.git"
INSTALL_DIR="/opt/walkie-talkie"
SYSTEMD_SERVICE="walkie-talkie-bridge.service"
CONFIG_DIR="$HOME/.tailtalkie"
BIN_DIR="/usr/local/bin"

echo -e "${GREEN}=== Walkie-Talkie Bridge Installer ===${NC}"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Detect system architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        GOARCH="amd64"
        ;;
    aarch64)
        GOARCH="arm64"
        ;;
    armv7l)
        GOARCH="arm"
        ;;
    *)
        echo -e "${RED}Error: Unsupported architecture: $ARCH${NC}"
        exit 1
        ;;
esac

echo -e "${YELLOW}Detected architecture: $ARCH ($GOARCH)${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git not found. Installing git...${NC}"
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
        apt-get update -qq
        apt-get install -y -qq git
    elif command -v yum &> /dev/null; then
        yum install -y -q git
    elif command -v dnf &> /dev/null; then
        dnf install -y -q git
    elif command -v apk &> /dev/null; then
        apk add --no-cache git
    elif command -v zypper &> /dev/null; then
        zypper install -y git
    else
        echo -e "${RED}Error: Could not detect package manager. Please install git manually.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Git installed successfully${NC}"
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${YELLOW}Go not found. Installing Go...${NC}"
    
    # Download and install Go
    GO_VERSION="1.25.0"
    GO_TARBALL="go${GO_VERSION}.linux-${GOARCH}.tar.gz"
    GO_URL="https://go.dev/dl/${GO_TARBALL}"
    
    cd /tmp
    wget -q "$GO_URL" -O "$GO_TARBALL"
    tar -C /usr/local -xzf "$GO_TARBALL"
    rm "$GO_TARBALL"
    
    # Add Go to PATH
    if ! grep -q "export PATH=\$PATH:/usr/local/go/bin" /etc/profile; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    fi
    
    export PATH=$PATH:/usr/local/go/bin
    echo -e "${GREEN}✓ Go installed successfully${NC}"
fi

# Verify Go installation
export PATH=$PATH:/usr/local/go/bin
GO_VERSION=$(go version | awk '{print $3}')
echo -e "${GREEN}✓ Found $GO_VERSION${NC}"

# Create installation directory
echo -e "${YELLOW}Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"

# Clone or update repository
if [ -d "$INSTALL_DIR/tailscale-app" ]; then
    echo -e "${YELLOW}Updating existing installation...${NC}"
    cd "$INSTALL_DIR/tailtailkie"
    git pull --quiet
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    cd /tmp
    git clone --depth 1 "$REPO_URL" --quiet
    mv tailtailkie "$INSTALL_DIR"
fi

# Build the bridge
echo -e "${YELLOW}Building bridge...${NC}"
cd "$INSTALL_DIR/tailscale-app"
go build -o "$BIN_DIR/walkie-talkie-bridge" ./bridge

if [ ! -f "$BIN_DIR/walkie-talkie-bridge" ]; then
    echo -e "${RED}Error: Failed to build bridge${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Bridge built successfully${NC}"

# Create config directory
echo -e "${YELLOW}Setting up configuration...${NC}"
mkdir -p "$CONFIG_DIR"
chown -R $(whoami):$(whoami) "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

# Create systemd service
echo -e "${YELLOW}Installing systemd service...${NC}"
cat > /etc/systemd/system/$SYSTEMD_SERVICE <<EOF
[Unit]
Description=Walkie-Talkie Bridge Service
Documentation=https://github.com/codejedi-ai/Kaggle-For-Tensors
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$(whoami)
Group=$(whoami)
ExecStart=$BIN_DIR/walkie-talkie-bridge run
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=walkie-talkie-bridge

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service (but don't start yet)
systemctl enable $SYSTEMD_SERVICE --quiet

echo -e "${GREEN}✓ Systemd service installed${NC}"

# Check if config exists
if [ ! -f "$CONFIG_DIR/config.json" ]; then
    echo
    echo -e "${YELLOW}=== Initial Configuration Required ===${NC}"
    echo
    echo "Run the following command to configure your bridge:"
    echo -e "${GREEN}  sudo walkie-talkie-bridge init${NC}"
    echo
    echo "Or manually create $CONFIG_DIR/config.json"
    echo
    echo "After configuration, start the service:"
    echo -e "${GREEN}  sudo systemctl start $SYSTEMD_SERVICE${NC}"
else
    echo -e "${GREEN}✓ Configuration found${NC}"
    echo
    echo "Starting service..."
    systemctl start $SYSTEMD_SERVICE
    echo -e "${GREEN}✓ Service started${NC}"
fi

echo
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo
echo "Useful commands:"
echo "  sudo systemctl status $SYSTEMD_SERVICE  # Check service status"
echo "  sudo systemctl stop $SYSTEMD_SERVICE    # Stop service"
echo "  sudo systemctl restart $SYSTEMD_SERVICE # Restart service"
echo "  journalctl -u $SYSTEMD_SERVICE -f       # View logs"
echo "  walkie-talkie-bridge help               # Show CLI help"
echo
echo "Configuration: $CONFIG_DIR/config.json"
echo "Logs: journalctl -u $SYSTEMD_SERVICE"
echo
