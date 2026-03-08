package main

import "errors"

const (
	defaultBridgeName  = "nanobot-gateway"
	defaultLocalAgent  = "http://127.0.0.1:8000"
	defaultPeerInPort  = 80
	defaultInboundPort = 80
	defaultLocalListen = "127.0.0.1:8080"
	maxBodyBytes       = 1 << 20 // 1 MiB
)

var (
	errOutboundRequired = errors.New("dest_node and payload are required")
	errInboundRequired  = errors.New("payload is required")
)
