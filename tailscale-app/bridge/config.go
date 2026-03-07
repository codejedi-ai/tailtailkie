package main

import (
	"os"
	"strconv"
)

// BridgeConfig contains runtime settings for the bridge bot client.
type BridgeConfig struct {
	BridgeName      string
	StateDir        string
	AuthKey         string
	LocalAgentURL   string
	PeerInboundPort int
	InboundPort     int
	LocalListen     string
}

func loadConfig() BridgeConfig {
	return BridgeConfig{
		BridgeName:      getenv("BRIDGE_NAME", defaultBridgeName),
		StateDir:        getenv("TSNET_STATE_DIR", defaultStateDir),
		AuthKey:         os.Getenv("TS_AUTHKEY"),
		LocalAgentURL:   getenv("LOCAL_AGENT_URL", defaultLocalAgent),
		PeerInboundPort: getenvInt("PEER_BRIDGE_INBOUND_PORT", defaultPeerInPort),
		InboundPort:     getenvInt("BRIDGE_INBOUND_PORT", defaultInboundPort),
		LocalListen:     getenv("BRIDGE_LOCAL_LISTEN", defaultLocalListen),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
