# Tailscale A2A Bridge

This repository contains a Tailscale Agent-to-Agent (A2A) bridge that embeds Tailscale directly into your applications using `tsnet`.

## Core Features

- **Transparent Proxy**: Forwards all Tailnet traffic to your local agent (port 18789 by default).
- **Identity Injection**: Automatically adds `X-A2A-Sender` and `X-A2A-Node` headers to inbound requests.
- **Robust Discovery**: Automatic peer detection with an identity-based handshake.
- **WebSocket Support**: Seamless bidirectional streaming for both inbound and outbound connections.
- **Egress Proxy**: Allows your local agent to call other mesh agents via a local helper (`127.0.0.1:8080`).

## Quick Start

### 1. Configure the Bridge

Set your Tailscale Auth Key and run the initialization:

```bash
cd bridge
go run . init
```

Alternatively, export your key and run directly (it will use defaults):

```bash
export TS_AUTHKEY=tskey-auth-...
go run . run
```

### 2. Verify Connection

Once running, the bridge will print its connectivity status:
```text
🚀 tsa2a Bridge Online!
External (Tailnet): http://nanobot-gateway/
Internal Forward:   http://127.0.0.1:18789
Discovery:         http://nanobot-gateway/tsa2a/discovery
✅ Tailscale IP(s): 100.x.y.z
```

## Documentation

- **[PREREQUISITES.md](PREREQUISITES.md)**: Detailed setup and system requirements.
- **[Agent Communication](docs/agent-communication.md)**: How the transparent proxy and identity headers work.
- **[Discovery Handshake](docs/discovery.md)**: Details on the secure peer discovery mechanism.
- **[WebSocket Support](docs/websockets.md)**: Using WebSockets for real-time communication.
- **[Configuration Reference](docs/configuration.md)**: Detailed `config.json` and environment variable guide.

## Repository Structure

- `bridge/`: The Go implementation of the A2A bridge.
- `docs/`: Technical documentation and architecture guides.
- `protocol/`: Shared protocol definitions.
- `scripts/`: Installation and utility scripts.
- `state/`: Persistent Tailscale identity state (ignored by git).
