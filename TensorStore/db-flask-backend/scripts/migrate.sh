#!/usr/bin/env bash

source scripts/common.sh

docker rm --force "${SERVICE_NAME}-migrations" 2>/dev/null

export DB_HOST="localhost"
export FLASK_APP="manage.py"

set -e

if [[ "$1" == "upgrade" ]]; then
    echoc "Building database migrations image..."

    docker build \
        --platform "linux/x86_64" \
        --tag "${SERVICE_NAME}" \
        --build-arg BUILD_VERSION="${BUILD_VERSION}" \
        --build-arg PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL}" \
        .

    echoc "Starting up database migrations..."

    docker run \
        --rm \
        --platform "linux/x86_64" \
        --env-file "configuration.env" \
        --env-file ".env" \
        --env FLASK_APP="manage.py" \
        --name "${SERVICE_NAME}-migrations" \
        --volume "${PWD:?}/database/certs:/certs/" \
        --network "${SERVICE_NAME}-bridge" \
        --entrypoint "/app/venv/bin/flask" \
        "${SERVICE_NAME}" \
        db upgrade
else
    set -a

    source configuration.env
    source .env

    set +a

    export DB_HOST="localhost"
    export DB_SSL_CERT_PATH="database/certs/server-cert.pem"
    export DB_SSL_PRIVATE_KEY_PATH="database/certs/server-key.pem"
    export DB_SSL_CA_CERT_PATH="database/certs/ca.pem"

    echoc "Running database migrations..."

    "${VIRTUAL_ENV_NAME}/bin/flask" db migrate --directory database/migrations
fi
