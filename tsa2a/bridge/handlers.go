package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/codejedi-ai/kaggle-for-tensors/tailscale-app/protocol"
	"net/http/httputil"
	"net/url"
	"net"

	"tailscale.com/tsnet"
)

func makeTransparentProxyHandler(targetURL string, ts *tsnet.Server) http.HandlerFunc {
	target, _ := url.Parse(targetURL)
	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director

	lc, _ := ts.LocalClient()

	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		// Inject identity so Nanobot knows WHO is calling from the mesh
		if lc != nil {
			if who, err := lc.WhoIs(req.Context(), req.RemoteAddr); err == nil {
				req.Header.Set("X-A2A-Sender", who.UserProfile.LoginName)
				req.Header.Set("X-A2A-Node", who.Node.ComputedName)
			}
		}
	}

	return func(w http.ResponseWriter, r *http.Request) {
		// httputil.ReverseProxy handles WebSocket hijacking automatically in newer Go versions
		// if we ensure we don't mess with the connection before forwarding.
		proxy.ServeHTTP(w, r)
	}
}

func makeEgressProxyHandler(ts *tsnet.Server) http.HandlerFunc {
	httpClient := ts.HTTPClient()
	return func(w http.ResponseWriter, r *http.Request) {
		// Extract the target URL from the path
		// Expected format: /tsa2a/proxy/http://other-agent/api
		targetPath := strings.TrimPrefix(r.URL.Path, "/tsa2a/proxy/")
		if targetPath == "" {
			http.Error(w, "missing target URL", http.StatusBadRequest)
			return
		}

		// If it doesn't start with http, it's likely just a hostname, so we add http://
		if !strings.HasPrefix(targetPath, "http://") && !strings.HasPrefix(targetPath, "https://") {
			targetPath = "http://" + targetPath
		}

		targetURL, err := url.Parse(targetPath)
		if err != nil {
			http.Error(w, "invalid target URL: "+err.Error(), http.StatusBadRequest)
			return
		}

		// Handle WebSocket upgrade for egress
		if strings.ToLower(r.Header.Get("Upgrade")) == "websocket" {
			proxyWebSocketOutbound(w, r, targetURL, ts)
			return
		}

		outReq, err := http.NewRequestWithContext(r.Context(), r.Method, targetPath, r.Body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for k, vv := range r.Header {
			for _, v := range vv {
				outReq.Header.Add(k, v)
			}
		}

		resp, err := httpClient.Do(outReq)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		defer resp.Body.Close()

		for k, vv := range resp.Header {
			for _, v := range vv {
				w.Header().Add(k, v)
			}
		}
		w.WriteHeader(resp.StatusCode)
		io.Copy(w, resp.Body)
	}
}

func proxyWebSocketOutbound(w http.ResponseWriter, r *http.Request, targetURL *url.URL, ts *tsnet.Server) {
	// 1. Dial the remote agent over Tailscale
	host := targetURL.Host
	if !strings.Contains(host, ":") {
		port := "80"
		if targetURL.Scheme == "https" || targetURL.Scheme == "wss" {
			port = "443"
		}
		host = net.JoinHostPort(host, port)
	}

	targetConn, err := ts.Dial(r.Context(), "tcp", host)
	if err != nil {
		http.Error(w, "failed to dial remote agent: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer targetConn.Close()

	// 2. Perform the WebSocket handshake (Raw HTTP)
	// We construct the manual upgrade request since we are already in the handler
	targetURL.Scheme = "http" // Use http for the initial handshake over tsnet dial
	if targetURL.Path == "" {
		targetURL.Path = "/"
	}

	fmt.Fprintf(targetConn, "%s %s HTTP/1.1\r\n", r.Method, targetURL.RequestURI())
	for k, vv := range r.Header {
		for _, v := range vv {
			fmt.Fprintf(targetConn, "%s: %s\r\n", k, v)
		}
	}
	fmt.Fprintf(targetConn, "Host: %s\r\n", targetURL.Host)
	fmt.Fprintf(targetConn, "\r\n")

	// 3. Hijack the local connection
	hj, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "webserver doesn't support hijacking", http.StatusInternalServerError)
		return
	}
	clientConn, _, err := hj.Hijack()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer clientConn.Close()

	// 4. Bidirectional copy
	errChan := make(chan error, 2)
	go func() {
		_, err := io.Copy(targetConn, clientConn)
		errChan <- err
	}()
	go func() {
		_, err := io.Copy(clientConn, targetConn)
		errChan <- err
	}()

	<-errChan
}

func makeIdentityHandler(bridgeName string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"type": "tailscale-a2a-agent",
			"name": bridgeName,
		})
	}
}

func makeDiscoveryHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if discoverySvc == nil {
			http.Error(w, "discovery service not initialized", http.StatusInternalServerError)
			return
		}

		agents := discoverySvc.GetOnlineVerifiedAgents()
		var hostnames []string
		for _, a := range agents {
			hostnames = append(hostnames, a.Hostname)
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(hostnames); err != nil {
			log.Printf("[discovery] failed to encode response: %v", err)
		}
	}
}

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
