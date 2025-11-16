#!/usr/bin/env bash

source scripts/common.sh

CLUSTER_NAME="${SERVICE_NAME}"
CLUSTER_MATCH=$(kind get clusters | grep "${CLUSTER_NAME}")

set -e

IS_CONTAINER_REGISTRY_RUNNING="$(docker inspect -f '{{.State.Running}}' "${CONTAINER_REGISTRY}" 2>/dev/null || true)"

if [[ "${IS_CONTAINER_REGISTRY_RUNNING}" != "true" ]]; then
  echoc "Starting up local container registry..."

  docker run \
    --platform "linux/x86_64" \
    --detach \
    --restart=always \
    --publish "127.0.0.1:5050:5000" \
    --name "${CONTAINER_REGISTRY}" \
    registry:2
fi


if [[ "${CLUSTER_MATCH}" == "${CLUSTER_NAME}" ]]; then
    echoc "Cluster already exists... Skipping cluster creation."
else
    # Startup KinD cluster
    kind create cluster \
        --name "${CLUSTER_NAME}" \
        --config kind/cluster.yaml \
        --wait 5m

    docker network connect "kind" "${CONTAINER_REGISTRY}" || true # Network could be connected already


    kubectl cluster-info --context "kind-${CLUSTER_NAME}"

    echoc "Deploying nginx ingress..."

    # Deploy nginx ingress https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/kind/deploy.yaml
    kubectl apply -f kind/nginx-ingress.yaml

    # Wait for the ingress to become available
    kubectl wait --namespace "ingress-nginx" \
        --for=condition=ready pod \
        --selector="app.kubernetes.io/component=controller" \
        --timeout=2m

    kubectl apply -f "kind/local-registry-hosting.yaml"
fi