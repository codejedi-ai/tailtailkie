#!/usr/bin/env bash

source scripts/common.sh

docker rm --force "${DB_HOST}" > /dev/null 2>&1

[ -z $(docker network ls --filter "name=${SERVICE_NAME}-bridge" --quiet) ] && \
    echoc "Creating API network..." && \
    docker network create --driver bridge "${SERVICE_NAME}-bridge"

set -e

echoc "Building API database image..."

docker build \
    --platform "linux/x86_64" \
    --tag "${SERVICE_NAME}-database:0.0.0" \
    --file "database/Dockerfile" \
    .

echoc "Starting up API database..."

docker run \
    --platform "linux/x86_64" \
    --name "${DB_HOST}" \
    --publish "3306:3306" \
    --env MYSQL_ROOT_PASSWORD="secret" \
    --env MYSQL_DATABASE="${DB_DATABASE}" \
    --env MYSQL_USER="${DB_USERNAME}" \
    --env MYSQL_PASSWORD="${DB_PASSWORD}" \
    --security-opt "seccomp=unconfined" \
    --detach \
    --network "${SERVICE_NAME}-bridge" \
    "${SERVICE_NAME}-database:0.0.0"

export DB_HOST="localhost"
export DB_SSL_CERT_PATH="database/certs/server-cert.pem"
export DB_SSL_PRIVATE_KEY_PATH="database/certs/server-key.pem"
export DB_SSL_CA_CERT_PATH="database/certs/ca.pem"
export BUILD_VERSION="${BUILD_VERSION}"

until venv/bin/python database/is_database_ready.py
do
    echoc "Database is not ready. Retrying..." "${YELLOW}"
    sleep 10
done


# Even after database is ready we want to give it a few seconds before allowing any connections
sleep 10

echoc "Database is ready!"
