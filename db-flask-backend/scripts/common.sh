#!/usr/bin/env bash

PWD=$(pwd)
GCLOUD_AUTH_ACCESS_TOKEN="$(gcloud auth print-access-token || (gcloud auth login && gcloud auth print-access-token))"
ARTIFACT_REGISTRY_PROJECT="releaseinf"
PIP_EXTRA_INDEX_URL=""
SERVICE_NAME="tensorstore-backend"
BUILD_VERSION="1.0.0"
VIRTUAL_ENV_NAME="venv"
DEPLOYMENT_NAME="${SERVICE_NAME}-local"
DEPLOYMENT_IMAGE="localhost:5050/${SERVICE_NAME}"
GET_SITE_PATH_SCRIPT='from distutils.sysconfig import get_python_lib; print(get_python_lib())'
PACKAGE_NAME="im_db_backend"
CLUSTER_NAME="${SERVICE_NAME}"
CONTAINER_REGISTRY="kind-registry"

[ -d "venv" ] && SITE_PATH=$("${VIRTUAL_ENV_NAME}/bin/python" -c "${GET_SITE_PATH_SCRIPT}")

SITE_PATH="${VIRTUAL_ENV_NAME}${SITE_PATH#*${VIRTUAL_ENV_NAME}}"

set -a

source configuration.env
source .env

set +a

# Colour printing :)
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"

# Usage:
# ```
# $ echoc "Message defaults to green colour"
# $ echoc "Set message to red colour" "${RED}"
# $ echoc "Set message to yellow colour" "${YELLOW}"
# ```
echoc(){
    RESET="\033[0m"

    echo -e "${2-${GREEN}}${1}${RESET}"
}
