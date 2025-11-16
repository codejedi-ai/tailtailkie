#!/usr/bin/env bash

source scripts/common.sh

if [ -n "${VIRTUAL_ENV}" ]; then
    "${VIRTUAL_ENV_NAME}/bin/pip-compile" --extra-index-url "${PIP_EXTRA_INDEX_URL}" --no-emit-index-url --no-emit-trusted-host --output-file "requirements.txt" "requirements.in" && \
    "${VIRTUAL_ENV_NAME}/bin/pip-compile" --no-emit-index-url --no-emit-trusted-host --output-file "dev-requirements.txt" "dev-requirements.in"
else
    echoc "You must be in virtual environment in order to sync requirements." "${RED}"
fi
