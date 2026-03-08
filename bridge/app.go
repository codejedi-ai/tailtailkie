package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"tailscale.com/tsnet"
)

var discoverySvc *DiscoveryService

func runBridge() {
	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	srv := &tsnet.Server{
		Hostname: cfg.BridgeName,
		Dir:      cfg.StateDir,
		AuthKey:  cfg.AuthKey,
	}
	defer srv.Close()

	// Initialize discovery service
	discoverySvc, err = NewDiscoveryService(srv)
	if err != nil {
		log.Fatalf("Failed to create discovery service: %v", err)
	}
	// Start discovery with 30-second interval
	discoverySvc.Start(30 * time.Second)

	tailnetClient := tsHTTPClient(srv, 20*time.Second)
	// localClient no longer needed for transparent proxy, but kept for legacy inbound if needed
	_ = &http.Client{Timeout: 20 * time.Second}

	go runOutboundServer(cfg.LocalListen, cfg.BridgeName, cfg.PeerInboundPort, tailnetClient)
	go logSelfTailscaleIPs(srv)

	ln, err := srv.Listen("tcp", fmt.Sprintf(":%d", cfg.InboundPort))
	if err != nil {
		log.Fatalf("bridge tailnet listen failed: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/.tsa2a/identity", makeIdentityHandler(cfg.BridgeName))
	mux.HandleFunc("/tsa2a/discovery", makeDiscoveryHandler())
	mux.HandleFunc("/tsa2a/proxy/", makeEgressProxyHandler(srv)) // Outbound helper
	mux.HandleFunc("/", makeTransparentProxyHandler(cfg.LocalAgentURL, srv))

	httpSrv := &http.Server{
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Printf("🚀 tsa2a Bridge Online!\n")
	fmt.Printf("External (Tailnet): http://%s/\n", cfg.BridgeName)
	fmt.Printf("Internal Forward:   %s\n", cfg.LocalAgentURL)
	fmt.Printf("Discovery:         http://%s/tsa2a/discovery\n", cfg.BridgeName)

	log.Printf("bridge node %q listening on tailnet :%d (state=%s)", cfg.BridgeName, cfg.InboundPort, cfg.StateDir)
	if err := httpSrv.Serve(ln); err != nil && err != http.ErrServerClosed {
		log.Fatalf("bridge serve failed: %v", err)
	}
}
