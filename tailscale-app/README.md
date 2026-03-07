# tsnet Peer-to-Peer Bridges

This folder contains a peer-to-peer implementation that embeds Tailscale directly into Go applications using `tsnet`.

- No `tailscaled` service required.
- No host Tailscale app required.
- Each binary is its own Tailnet node.
- Configuration stored in `~/.tailtalkie/config.json`

## Prerequisites

Before running bridges, complete the setup in **PREREQUISITES.md**:

- Go 1.25+
- Tailscale account with auth keys
- Local agent with HTTP endpoint
- Ports 8001, 8080 available

See [PREREQUISITES.md](PREREQUISITES.md) for detailed setup instructions.

## Components

- `bridge`: per-host peer bridge node
- `protocol/envelope.go`: JSON envelope schema

## Envelope format

```json
{
  "source_node": "bridge-alpha",
  "dest_node": "bridge-beta",
  "payload": {"type": "task", "message": "hello"}
}
```

## Quick Start

### 1) Initialize Configuration

Run the interactive setup:

```bash
cd tailscale-app
go run ./bridge init
```

This will:
- Create `~/.tailtalkie/` directory
- Prompt for your Tailscale auth key
- Prompt for bridge name and agent URL
- Save configuration to `~/.tailtalkie/config.json`

### 2) Start the Bridge

```bash
go run ./bridge
```

Or explicitly:

```bash
go run ./bridge run
```

### 3) Send a Message

```bash
curl -sS http://127.0.0.1:8080/send \
  -H 'content-type: application/json' \
  -d '{
    "source_node": "bridge-alpha",
    "dest_node": "bridge-beta",
    "payload": {"message": "hello from alpha"}
  }'
```

## Configuration

### Config File Location

`~/.tailtalkie/config.json`

### Config Schema

```json
{
  "bridge_name": "bridge-alpha",
  "state_dir": "/home/user/.tailtalkie/state",
  "auth_key": "tskey-auth-xxxxx",
  "local_agent_url": "http://127.0.0.1:9090/api",
  "peer_inbound_port": 8001,
  "inbound_port": 8001,
  "local_listen": "127.0.0.1:8080"
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `bridge_name` | ✅ | Unique identifier for this bridge |
| `auth_key` | ✅ | Tailscale authentication key |
| `state_dir` | ❌ | Directory for Tailscale state (auto-generated) |
| `local_agent_url` | ❌ | Your local agent's HTTP endpoint |
| `inbound_port` | ❌ | Port for inbound Tailnet connections |
| `peer_inbound_port` | ❌ | Port for outbound peer connections |
| `local_listen` | ❌ | Local endpoint for agent communication |

### Manual Configuration

You can also create the config file manually:

```bash
mkdir -p ~/.tailtalkie
cat > ~/.tailtalkie/config.json <<EOF
{
  "bridge_name": "bridge-alpha",
  "auth_key": "tskey-auth-your-key-here",
  "local_agent_url": "http://127.0.0.1:9090/api",
  "inbound_port": 8001,
  "local_listen": "127.0.0.1:8080"
}
EOF
```

## Commands

| Command | Description |
|---------|-------------|
| `bridge init` | Interactive configuration setup |
| `bridge run` | Start the bridge (default) |
| `bridge help` | Show help message |

## Notes

- The bridge local endpoint is `POST /send` on `local_listen` (default `127.0.0.1:8080`).
- The bridge tailnet endpoint is `POST /inbound` on `inbound_port` (default `8001`).
- Outbound routing is direct bridge-to-bridge using `dest_node` and `peer_inbound_port`.
- State directory persists node identity between restarts.
- Lock down communication with Tailscale ACLs and tags before production use.

## Multiple Bridges

To run multiple bridges on the same machine (for testing):

1. Run `bridge init` with different `bridge_name` values
2. Edit `~/.tailtalkie/config.json` to change ports if needed
3. Start each bridge with a different config directory

## Docs

- Setup guide: [PREREQUISITES.md](PREREQUISITES.md)
- Agent communication: [docs/agent-communication.md](docs/agent-communication.md)
