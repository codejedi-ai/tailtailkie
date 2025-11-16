#!/usr/bin/env bash

source scripts/common.sh

echoc "Creating database SSL cert volume..."

CERT_VOLUME_NAME="sre-im-db-backend-certs"

docker volume create "${CERT_VOLUME_NAME}"

echoc "Building database image..."

docker build \
    --tag "${SERVICE_NAME}-database" \
    --file "database/Dockerfile" \
    .

echoc "Starting up MySQL database SSL cert generator..."

docker run \
    --rm \
    --name "${SERVICE_NAME}-database-cert-generator" \
    --volume "${CERT_VOLUME_NAME}:/certs:rw" \
    --entrypoint "mysql_ssl_rsa_setup" \
    "${SERVICE_NAME}-database" \
    "--datadir=/certs/"

echoc "Starting up database SSL cert extractor..."

docker run \
    --detach \
    --name "${SERVICE_NAME}-database-cert-extractor" \
    --volume "${CERT_VOLUME_NAME}:/certs:ro" \
    --entrypoint "tail" \
    "alpine:3.15" \
    "-f" "/dev/null"

echoc "Copying database SSL certs onto local filesystem..."

docker cp "${SERVICE_NAME}-database-cert-extractor:/certs/ca-key.pem" "${PWD}/database/certs/"
docker cp "${SERVICE_NAME}-database-cert-extractor:/certs/ca.pem" "${PWD}/database/certs/"
docker cp "${SERVICE_NAME}-database-cert-extractor:/certs/private_key.pem" "${PWD}/database/certs/"
docker cp "${SERVICE_NAME}-database-cert-extractor:/certs/public_key.pem" "${PWD}/database/certs/"
docker cp "${SERVICE_NAME}-database-cert-extractor:/certs/server-cert.pem" "${PWD}/database/certs/"
docker cp "${SERVICE_NAME}-database-cert-extractor:/certs/server-key.pem" "${PWD}/database/certs/"

echoc "Removing database SSL cert extractor..."

docker rm -f "${SERVICE_NAME}-database-cert-extractor"

echoc "Removing database SSL cert volume..."

docker volume rm "${CERT_VOLUME_NAME}"
