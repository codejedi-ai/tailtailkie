# WebSocket Support

The bridge supports full bidirectional WebSockets for real-time agent communication.

## Inbound WebSockets (Calling your Agent)

If a remote agent wants to open a WebSocket to you:

1.  They connect to `ws://your-bridge-name/`.
2.  The bridge upgrades the connection and transparently pipes it to your local agent at `ws://127.0.0.1:8000/`.
3.  All WebSocket frames are forwarded bit-for-bit.

## Outbound WebSockets (Calling other Agents)

If your local agent wants to open a WebSocket to another agent on the mesh:

1.  Open a connection to the bridge's egress proxy:
    `ws://127.0.0.1:8080/tsa2a/proxy/ws://other-agent-name/`
2.  The bridge will dial `other-agent-name` over Tailscale, perform the upgrade handshake, and then pipe the data.

## Configuration

Make sure your local agent is listening for WebSocket connections on the port specified in `local_agent_url` (default is 8000).
