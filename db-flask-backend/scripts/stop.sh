#!/usr/bin/env bash

source scripts/common.sh

echoc "Removing local deployment..."

docker rm --force "${SERVICE_NAME}" "${SERVICE_NAME}-app" > /dev/null 2>&1

docker network rm "${SERVICE_NAME}-bridge" > /dev/null 2>&1
