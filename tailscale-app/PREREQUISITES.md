# Prerequisites for Walkie-Talkie Bridge (A2A Communication)

This guide covers everything you need to set up peer-to-peer agent-to-agent communication using Tailscale tsnet bridges.

## 1. System Requirements

### Hardware
- **RAM**: Minimum 512MB per bridge instance
- **Disk**: 100MB for state storage + logs
- **Network**: Internet access for initial Tailscale connection

### Operating System
- Linux (recommended for production)
- macOS
- Windows 10/11

## 2. Software Requirements

### Go Runtime
- **Version**: Go 1.25 or later
- **Installation**:
  ```bash
  # Linux
  wget https://go.dev/dl/go1.25.0.linux-amd64.tar.gz
  sudo tar -C /usr/local -xzf go1.25.0.linux-amd64.tar.gz
  export PATH=$PATH:/usr/local/go/bin

  # macOS
  brew install go@1.25

  # Verify installation
  go version  # Should show go1.25 or later
  ```

### Tailscale Account
- Free account at https://tailscale.com
- Access to admin console for generating auth keys

## 3. Tailscale Setup

### Step 1: Create Tailscale Account
1. Go to https://tailscale.com
2. Sign up with Google, Microsoft, GitHub, or email

### Step 2: Generate Auth Keys
1. Navigate to https://login.tailscale.com/admin/settings/keys
2. Click **Generate auth key**
3. Configure key settings:
   - ✅ **Ephemeral** (recommended for bridges)
   - ✅ **Pre-authorized**
   - Set expiration (or no expiration for testing)
4. Copy the generated key (format: `tskey-auth-...`)

### Step 3: Note Your Tailnet Name
- Your tailnet name appears in the admin console
- Format: `yourname.ts.net`
- Bridge hostnames will be: `bridge-alpha.yourname.ts.net`

## 4. Network Requirements

### Ports
| Port | Purpose | Direction |
|------|---------|-----------|
| 8001 | Bridge inbound (Tailnet) | Bridge-to-Bridge |
| 8080 | Local agent endpoint | Localhost only |
| 9090 | Agent API (example) | Localhost only |

### Firewall Rules
- Allow outbound connections on all ports (Tailscale handles encryption)
- No inbound ports need to be opened (Tailscale uses NAT traversal)

## 5. Environment Setup

### Required Environment Variables

```bash
# Tailscale Authentication
TS_AUTHKEY=tskey-auth-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Bridge Identity (unique per host)
BRIDGE_NAME=bridge-alpha

# State Directory (persistent storage)
TSNET_STATE_DIR=./state/bridge-alpha

# Bridge Ports
BRIDGE_INBOUND_PORT=8001
PEER_BRIDGE_INBOUND_PORT=8001
BRIDGE_LOCAL_LISTEN=127.0.0.1:8080

# Local Agent URL (your agent's API endpoint)
LOCAL_AGENT_URL=http://127.0.0.1:9090/api
```

### Optional Environment Variables

```bash
# HMAC Secret for envelope authentication (shared among trusted bridges)
BRIDGE_HMAC_SECRET=your-shared-secret-here
```

## 6. Local Agent Requirements

Your local agent (AI service, application, etc.) must:

### HTTP Endpoint
- Accept POST requests at `LOCAL_AGENT_URL`
- Parse JSON payload from bridge
- Return JSON response

### Example Agent (Python)
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api', methods=['POST'])
def handle_message():
    payload = request.json
    # Process the message
    response = {"status": "received", "data": payload}
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=9090)
```

### Example Agent (Node.js)
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api', (req, res) => {
  const payload = req.body;
  // Process the message
  res.json({ status: 'received', data: payload });
});

app.listen(9090, '127.0.0.1');
```

## 7. Quick Verification Checklist

Before running bridges, verify:

- [ ] Go 1.25+ installed: `go version`
- [ ] Tailscale account created
- [ ] Auth key generated (ephemeral recommended)
- [ ] Ports 8001, 8080, 9090 available
- [ ] Local agent running and accessible
- [ ] State directory exists or can be created

## 8. Installation Steps

### Clone and Build
```bash
cd tailscale-app

# Download dependencies
go mod download

# Build the bridge
go build -o bridge ./bridge
```

### Create State Directory
```bash
mkdir -p state/bridge-alpha
mkdir -p state/bridge-beta
```

### Copy Environment File
```bash
cp .env .env.local
# Edit .env.local with your actual values
```

## 9. Running Multiple Bridges

Each bridge needs:
- Unique `BRIDGE_NAME`
- Unique `TSNET_STATE_DIR`
- Same `TS_AUTHKEY` (or different keys per bridge)

Example for two bridges on same host (testing):
```bash
# Bridge Alpha
TS_AUTHKEY=tskey-xxx \
BRIDGE_NAME=bridge-alpha \
TSNET_STATE_DIR=./state/bridge-alpha \
BRIDGE_LOCAL_LISTEN=127.0.0.1:8080 \
LOCAL_AGENT_URL=http://127.0.0.1:9090/api \
go run ./bridge

# Bridge Beta (different terminal)
TS_AUTHKEY=tskey-xxx \
BRIDGE_NAME=bridge-beta \
TSNET_STATE_DIR=./state/bridge-beta \
BRIDGE_LOCAL_LISTEN=127.0.0.1:8081 \
LOCAL_AGENT_URL=http://127.0.0.1:9091/api \
go run ./bridge
```

## 10. Security Considerations

### Before Production

1. **Tailscale ACLs**: Configure access control lists
   - See `docs/tailscale-acl.example.json`
   - Restrict which bridges can communicate

2. **HMAC Authentication**: Enable envelope signing
   - Set `BRIDGE_HMAC_SECRET` on all trusted bridges
   - Validate signatures on inbound messages

3. **Tags**: Use Tailscale tags for bridge identification
   - Tag bridges with `tag:bridge` in ACLs
   - Enforce tag-based access policies

4. **Key Rotation**: Rotate auth keys periodically
   - Use ephemeral keys for automatic cleanup
   - Monitor key usage in admin console

## 11. Troubleshooting

### Bridge Won't Start
```bash
# Check Go version
go version  # Must be 1.25+

# Check if port is in use
lsof -i :8001
lsof -i :8080

# Check state directory permissions
ls -la ./state/
```

### Can't Connect to Peer
```bash
# Verify both bridges are online
tailscale status  # If tailscale CLI is installed

# Check bridge logs for errors
# Look for "Listening on" messages

# Verify BRIDGE_NAME is unique
echo $BRIDGE_NAME
```

### Auth Key Issues
- Ensure key is not expired
- Check key has not been revoked
- Verify key has correct permissions (ephemeral vs. regular)

## 12. Next Steps

After completing prerequisites:

1. **Quick Start**: See `README.md` for running bridges
2. **Architecture**: Read `docs/agent-communication.md` for message flow
3. **Security**: Configure ACLs in `docs/tailscale-acl.example.json`
4. **Engineering Notes**: Check `../engineering-notebook/README.md`

## Support

- Tailscale Docs: https://tailscale.com/kb/
- tsnet Reference: https://pkg.go.dev/tailscale.com/tsnet
- Issues: GitHub repository issues
