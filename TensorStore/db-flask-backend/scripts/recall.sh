#!/usr/bin/env bash

source scripts/common.sh

set -e

echoc "Removing deployment from local KinD cluster ${CLUSTER_NAME}..."

# Ensure that we are using our cluster
kubectl cluster-info --context "kind-${CLUSTER_NAME}"

helm uninstall "${DEPLOYMENT_NAME}" > /dev/null 2>&1
