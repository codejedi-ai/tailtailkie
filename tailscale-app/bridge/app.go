package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"tailscale.com/tsnet"
)

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

	tailnetClient := tsHTTPClient(srv, 20*time.Second)
	localClient := &http.Client{Timeout: 20 * time.Second}

	go runOutboundServer(cfg.LocalListen, cfg.BridgeName, cfg.PeerInboundPort, tailnetClient)
	go logSelfTailscaleIPs(srv)

	ln, err := srv.Listen("tcp", fmt.Sprintf(":%d", cfg.InboundPort))
	if err != nil {
		log.Fatalf("bridge tailnet listen failed: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/inbound", makeInboundHandler(cfg.BridgeName, cfg.LocalAgentURL, localClient))

	httpSrv := &http.Server{
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("bridge node %q listening on tailnet :%d (state=%s)", cfg.BridgeName, cfg.InboundPort, cfg.StateDir)
	if err := httpSrv.Serve(ln); err != nil && err != http.ErrServerClosed {
		log.Fatalf("bridge serve failed: %v", err)
	}
}
