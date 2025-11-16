from prometheus_flask_exporter import NO_PREFIX
from prometheus_flask_exporter.multiprocess import GunicornInternalPrometheusMetrics

from im_db_backend.app import create_application

application = create_application()

metrics = GunicornInternalPrometheusMetrics(
    defaults_prefix=NO_PREFIX,
    buckets=(
        0.005,
        0.01,
        0.025,
        0.05,
        0.075,
        0.1,
        0.25,
        0.5,
        0.75,
        1.0,
        2.5,
        4.0,
        5.0,
        7.0,
        7.5,
        10.0,
        float("inf"),
    ),
)

metrics.init_app(application)
