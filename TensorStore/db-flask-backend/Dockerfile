FROM python:3.10.0 AS build

COPY setup.py requirements.txt README.md manage.py /app/
COPY database/migrations /app/migrations
COPY database/is_database_ready.py /app/migrations/

ARG PIP_EXTRA_INDEX_URL

ENV VENV_PATH=/app/venv \
    PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL}"

RUN python3 -m venv "${VENV_PATH}" && \
    "${VENV_PATH}/bin/python" -m pip install --upgrade pip==22.0.4 && \
    "${VENV_PATH}/bin/python" -m pip install --extra-index-url "${PIP_EXTRA_INDEX_URL}" --no-cache-dir -r /app/requirements.txt

COPY src /app/src/

RUN "${VENV_PATH}/bin/python" -m pip install /app

FROM python:3.10.9-slim AS serve

ARG BUILD_VERSION

ENV VENV_PATH=/app/venv \
    APP_USER=im_db_backend \
    BUILD_VERSION="${BUILD_VERSION}" \
    PROMETHEUS_MULTIPROC_DIR=/app/metrics

WORKDIR /app

RUN groupadd --system "${APP_USER}" && \
    useradd --create-home --system --shell /bin/false --gid "${APP_USER}" "${APP_USER}" --uid 1000 && \
    mkdir -p /app/metrics /certs && \
    chown -R "${APP_USER}:${APP_USER}" /app /certs

COPY --from=build "${VENV_PATH}/" "${VENV_PATH}/"
COPY --from=build /app/src/im_db_backend/app /app/src/im_db_backend/app
COPY --from=build /app/manage.py /app/manage.py
COPY --from=build /app/migrations /app/migrations

USER 1000

EXPOSE 5000

ENTRYPOINT [ "venv/bin/gunicorn" ]

CMD [ "-c", "/app/src/im_db_backend/app/gunicorn.conf.py", "src.im_db_backend.app.app:application" ]
