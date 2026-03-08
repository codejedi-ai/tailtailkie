# Configuration Reference

The bridge is configured via a JSON file and optional environment variables.

## Configuration File

The bridge looks for its configuration at: `~/.tailtalkie/config.json`.

### Schema

```json
{
  "bridge_name": "nanobot-gateway",
  "auth_key": "tskey-auth-...",
  "local_agent_url": "http://127.0.0.1:18789",
  "inbound_port": 80,
  "peer_inbound_port": 80,
  "local_listen": "127.0.0.1:8080",
  "state_dir": "/Users/name/.tailtalkie/state"
}
```

### Fields

- `bridge_name`: The hostname the bridge will use on the Tailnet.
- `auth_key`: Your Tailscale Auth Key. If empty, it will fall back to the `TS_AUTHKEY` environment variable.
- `local_agent_url`: The URL of your local agent (where the bridge forwards traffic).
- `inbound_port`: The port the bridge listens on within the Tailnet (default: 80).
- `peer_inbound_port`: The port used to reach other bridges (default: 80).
- `local_listen`: The address the bridge listens on for local agent calls (default: 127.0.0.1:8080).
- `state_dir`: Directory where Tailscale state (identity) is stored.

## Environment Variables

- `TS_AUTHKEY`: Fallback auth key if not provided in the config file.
- `TSNET_FORCE_LOGIN`: Set to `1` to force the bridge to re-authenticate using the auth key even if state exists.
