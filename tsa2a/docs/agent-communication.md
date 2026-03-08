# Agent Communication Flow (Transparent Proxy)

This document explains how local AI agents communicate through peer `Bridge` nodes on Tailnet using `tsnet`.

## Architecture Overview

The bridge acts as a **transparent reverse proxy**. It sits on the Tailnet and forwards all traffic to your local agent running on `localhost`.

### Inbound Flow (Mesh -> Agent)

1.  A remote agent calls your bridge name: `http://nanobot-gateway/chat`.
2.  The bridge receives the request and identifies the sender via Tailscale.
3.  The bridge injects identity headers: `X-A2A-Sender` and `X-A2A-Node`.
4.  The bridge forwards the request to your local agent at `http://127.0.0.1:8000/chat`.
5.  Your agent responds, and the bridge passes the response back to the requester.

### Outbound Flow (Agent -> Mesh)

1.  Your local agent wants to call another agent: `http://other-agent/api`.
2.  Your agent sends the request to the bridge's local egress endpoint: `http://127.0.0.1:8080/tsa2a/proxy/http://other-agent/api`.
3.  The bridge receives this, uses its Tailscale identity to reach `other-agent`, and forwards the request.
4.  The response from the remote agent is passed back to your agent.

## Identity Headers

Incoming requests to your agent contain:
- `X-A2A-Sender`: The Tailscale login name of the caller (e.g., `user@example.com`).
- `X-A2A-Node`: The DNS name of the calling device/node.

## Bidirectional Support

The bridge supports:
- **HTTP**: Standard REST/JSON APIs.
- **WebSockets**: Bidirectional streaming for real-time gateways.
