#!/usr/bin/env bash

source scripts/common.sh

echoc "Removing local KinD cluster ${CLUSTER_NAME}..."

# Remove cluster
kind delete cluster --name "${CLUSTER_NAME}"

docker rm -f "${CONTAINER_REGISTRY}"