# tsnet Peer-to-Peer Bridges

This folder contains a peer-to-peer implementation that embeds Tailscale directly into Go applications using `tsnet`.

- No `tailscaled` service required.
- No host Tailscale app required.
- Each binary is its own Tailnet node.

## Components

- `bridge`: per-host peer bridge node (`bridge-alpha` by default)
- `protocol/envelope.go`: JSON envelope schema

## Envelope format

```json
{
  "source_node": "bridge-alpha",
  "dest_node": "bridge-beta",
  "payload": {"type": "task", "message": "hello"}
}
```

## Prerequisites

- Go 1.25+
- Tailscale auth keys from your admin console (ephemeral keys recommended)

## Run

### 1) Start bridge on Host A

```bash
cd tailscale-app
TS_AUTHKEY=tskey-auth-bridge-a \
BRIDGE_NAME=bridge-alpha \
TSNET_STATE_DIR=./state/bridge-alpha \
PEER_BRIDGE_INBOUND_PORT=8001 \
LOCAL_AGENT_URL=http://127.0.0.1:9090/api \
go run ./bridge
```

### 2) Start bridge on Host B

```bash
cd tailscale-app
TS_AUTHKEY=tskey-auth-bridge-b \
BRIDGE_NAME=bridge-beta \
TSNET_STATE_DIR=./state/bridge-beta \
PEER_BRIDGE_INBOUND_PORT=8001 \
LOCAL_AGENT_URL=http://127.0.0.1:9090/api \
go run ./bridge
```

### 3) Send from local agent side to another peer bridge

```bash
curl -sS http://127.0.0.1:8080/send \
  -H 'content-type: application/json' \
  -d '{
    "source_node": "bridge-alpha",
    "dest_node": "bridge-beta",
    "payload": {"message": "hello from alpha"}
  }'
```

## Notes

- The bridge local endpoint is `POST /send` on `BRIDGE_LOCAL_LISTEN` (default `127.0.0.1:8080`).
- The bridge tailnet endpoint is `POST /inbound` on `BRIDGE_INBOUND_PORT` (default `8001`).
- Outbound routing is direct bridge-to-bridge using `dest_node` and `PEER_BRIDGE_INBOUND_PORT`.
- Persist `TSNET_STATE_DIR` so nodes keep identity between restarts.
- Lock down communication with Tailscale ACLs and tags before production use.

## Docs

- Agent communication details: `docs/agent-communication.md`
