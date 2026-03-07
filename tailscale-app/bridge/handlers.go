package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/codejedi-ai/kaggle-for-tensors/tailscale-app/protocol"
)

func makeInboundHandler(bridgeName, localAgentURL string, localClient *http.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		defer r.Body.Close()

		var env protocol.Envelope
		if err := json.NewDecoder(r.Body).Decode(&env); err != nil {
			http.Error(w, "invalid envelope json", http.StatusBadRequest)
			return
		}
		if err := validateInboundEnvelope(&env); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, localAgentURL, bytes.NewReader(env.Payload))
		if err != nil {
			http.Error(w, "failed to create local agent request", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := localClient.Do(req)
		if err != nil {
			http.Error(w, "local agent unreachable", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		copyHeaders(w.Header(), resp.Header)
		w.WriteHeader(resp.StatusCode)
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Printf("bridge copy response body error: %v", err)
		}

		log.Printf("[bridge:%s] delivered inbound payload from %s (%d)", bridgeName, env.SourceNode, resp.StatusCode)
	}
}

func makeAgentsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if discoverySvc == nil {
			http.Error(w, "discovery service not initialized", http.StatusInternalServerError)
			return
		}

		agents := discoverySvc.GetOnlineAgents()
		w.Header().Set("Content-Type", "application/json")
		
		response := map[string]interface{}{
			"agents": agents,
			"count":  len(agents),
		}
		
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("[agents] failed to encode response: %v", err)
		}
	}
}

func runOutboundServer(localListen, bridgeName string, peerInboundPort int, tailnetClient *http.Client) {
	mux := http.NewServeMux()
	mux.HandleFunc("/send", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
		defer r.Body.Close()

		var env protocol.Envelope
		if err := json.NewDecoder(r.Body).Decode(&env); err != nil {
			http.Error(w, "invalid envelope json", http.StatusBadRequest)
			return
		}
		if err := normalizeOutboundEnvelope(&env, bridgeName); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		payload, err := json.Marshal(env)
		if err != nil {
			http.Error(w, "failed to encode envelope", http.StatusInternalServerError)
			return
		}

		targetURL := fmt.Sprintf("http://%s:%d/inbound", env.DestNode, peerInboundPort)
		req, err := http.NewRequestWithContext(r.Context(), http.MethodPost, targetURL, bytes.NewReader(payload))
		if err != nil {
			http.Error(w, "failed to create destination request", http.StatusInternalServerError)
			return
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := tailnetClient.Do(req)
		if err != nil {
			http.Error(w, "destination bridge unreachable", http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		copyHeaders(w.Header(), resp.Header)
		w.WriteHeader(resp.StatusCode)
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Printf("bridge outbound copy response error: %v", err)
		}
		log.Printf("[bridge:%s] routed outbound to %s (%d)", bridgeName, env.DestNode, resp.StatusCode)
	})

	s := &http.Server{
		Addr:         localListen,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("bridge local server listening on %s (agent -> /send)", localListen)
	if err := s.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("bridge local server failed: %v", err)
	}
}
