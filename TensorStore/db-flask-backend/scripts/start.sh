#!/usr/bin/env bash
export NPM_AUTH_TOKEN="21a0d433-c15f-40e9-93be-bb46e6dad80d"
source scripts/common.sh

./scripts/stop.sh

[ -z $(docker network ls --filter "name=${SERVICE_NAME}-bridge" --quiet) ] && \
    echoc "Creating API network..." && \
    docker network create --driver bridge "${SERVICE_NAME}-bridge"

set -e

echoc "Building API image..."

docker build \
    --platform "linux/x86_64" \
    --tag "${SERVICE_NAME}:0.0.0" \
    --build-arg BUILD_VERSION="${BUILD_VERSION}" \
    --build-arg PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL}" \
    .

# echoc "Building Web Application image..."
# 
# docker build \
#     --platform "linux/x86_64" \
#     --tag "${SERVICE_NAME}-app:0.0.0" \
#     --file "${PWD:?}/app/development.Dockerfile" \
#     --build-arg NPM_AUTH_TOKEN="${NPM_AUTH_TOKEN}" \
#     "${PWD:?}/app"

echoc "Starting up API..."

docker run \
    --platform "linux/x86_64" \
    --detach \
    --publish "5000:5000" \
    --env-file "configuration.env" \
    --env-file ".env" \
    --name "${SERVICE_NAME}" \
    --network "${SERVICE_NAME}-bridge" \
    --volume "${PWD:?}/src/${PACKAGE_NAME}:/app/${SITE_PATH}/${PACKAGE_NAME}" \
    --volume "${PWD:?}/database/certs:/certs/" \
    "${SERVICE_NAME}:0.0.0"

# echoc "Starting up Web Application..."
# 
# docker run \
#     --platform "linux/x86_64" \
#     --detach \
#     --publish "3000:3000" \
#     --env-file "app/.env" \
#     --name "${SERVICE_NAME}-app" \
#     --volume "${PWD}/app:/app" \
#     --volume "/app/node_modules" \
#     --volume "/app/public" \
#     --network "${SERVICE_NAME}-bridge" \
#     "${SERVICE_NAME}-app:0.0.0"

echoc "All done! Happy development!"
