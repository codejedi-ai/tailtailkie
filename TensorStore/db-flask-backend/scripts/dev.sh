#!/usr/bin/env bash

CONFIGURATION_FILE="configuration.env"
SECRET_FILE=".env"

source scripts/common.sh

[ ! -f "${SECRET_FILE}" ] && \
    echoc "'${SECRET_FILE}' file not found! Please add '${SECRET_FILE}' file." "${RED}" && \
    return

[ ! -d "venv" ] && \
    echoc "Could not find virtual environment. Creating..." && \
    python3.10 -m venv "${VIRTUAL_ENV_NAME}";

[ ! -n "${VIRTUAL_ENV}" ] && \
    echoc "No active virtual environment found. Activating..."
    source "${VIRTUAL_ENV_NAME}/bin/activate";

eval _"$(declare -f deactivate)"

export LAST_CONFIGURATION_FILE="${PWD:?}/${CONFIGURATION_FILE}"
export LAST_SECRET_FILE="${PWD:?}/${SECRET_FILE}"

function deactivate() {
    _deactivate

    unset $(cat "$LAST_CONFIGURATION_FILE" | grep -vE "#" | cut -d "=" -f1)
    unset $(cat "$LAST_SECRET_FILE" | grep -vE "#" | cut -d "=" -f1)
    unset $(cat "app/.env" | grep -vE "#" | cut -d "=" -f1)
    unset LAST_CONFIGURATION_FILE
    unset LAST_SECRET_FILE
}

set -a

source configuration.env
source .env
source app/.env

set +a

if [ -n "$VIRTUAL_ENV" ]; then
    "${VIRTUAL_ENV_NAME}/bin/python" -m pip install --upgrade pip==23.0.1 && \
    "${VIRTUAL_ENV_NAME}/bin/python" -m pip install --extra-index-url "${PIP_EXTRA_INDEX_URL}" -r dev-requirements.txt -r requirements.txt && \
    "${VIRTUAL_ENV_NAME}/bin/python" -m pip install -e . && \ # installs the setup.py file
    "${VIRTUAL_ENV_NAME}/bin/pre-commit" install --hook-type commit-msg
else
    echoc "You must be in virtual environment in order to install packages." "${RED}"
fi
