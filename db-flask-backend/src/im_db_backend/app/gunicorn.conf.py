import os
from multiprocessing import cpu_count

from gunicorn import glogging
from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics

bind = f"0.0.0.0:{os.getenv('BIND_PORT', '5000')}"
workers = min(cpu_count() * 2 + 1, 10)
timeout = int(os.getenv("GUNICORN_TIMEOUT", "600"))

if os.getenv("ENVIRONMENT", None) == "local":
    reload = True  # pylint: disable=invalid-name

glogging.Logger.error_fmt = (
    '{ "date": "%(asctime)s","process": "%(process)d", ' '"severity": "%(levelname)s", "message": "%(message)s" }'
)


def child_exit(server, worker):  # pylint: disable=unused-argument
    GunicornInternalPrometheusMetrics.mark_process_dead_on_child_exit(worker.pid)
