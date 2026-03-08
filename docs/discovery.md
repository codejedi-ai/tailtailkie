# Agent Discovery Handshake

To ensure agents only connect to verified peers, the bridge implements a robust handshake mechanism.

## How it Works

The bridge automatically scans the Tailnet for other nodes and performs a verification step:

1.  **Peer Detection**: The bridge uses `LocalClient.Status()` to find other nodes in your tailnet.
2.  **Handshake**: For each discovered node, the bridge calls its identity endpoint: `http://<peer-ip>/.tsa2a/identity`.
3.  **Verification**: The bridge checks the response JSON. It must match:
    ```json
    {
      "type": "tailscale-a2a-agent",
      "name": "<bridge-name>"
    }
    ```
4.  **Registration**: Only nodes that pass this handshake are included in the discovery list.

## Using Discovery

Your agent can find other verified peers by calling the discovery endpoint:

- **Endpoint**: `http://nanobot-gateway/tsa2a/discovery` (from the mesh)
- **Endpoint**: `http://127.0.0.1:8080/tsa2a/discovery` (from your local host)

### Example Response

```json
[
  "nanobot-alpha",
  "nanobot-beta",
  "agent-prod-01"
]
```
