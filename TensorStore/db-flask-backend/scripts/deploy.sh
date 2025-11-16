#!/usr/bin/env bash

source scripts/common.sh

set -e

echoc "Building '${SERVICE_NAME}' image..."

docker build \
    --platform "linux/x86_64" \
    --build-arg BUILD_VERSION="${BUILD_VERSION}" \
    --build-arg PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL}" \
    --tag "${DEPLOYMENT_IMAGE}:0.1.0" \
    .

# Ensure that we are using KinD cluster
kubectl config use-context "kind-${SERVICE_NAME}"

echoc "Pushing '${SERVICE_NAME}' image to local container registry..."

docker push "${DEPLOYMENT_IMAGE}:0.1.0"

echoc "Installing '${SERVICE_NAME}' into local KinD cluster..."

helm upgrade "${DEPLOYMENT_NAME}" "charts/${SERVICE_NAME}" \
    --install \
    --values "charts/${SERVICE_NAME}/local-values.yaml" \
    --wait \
    --timeout 5m

echoc "All done!"
