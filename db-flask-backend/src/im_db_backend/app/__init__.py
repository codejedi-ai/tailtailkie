from flasgger import Swagger
from flask import Flask, Response, request
from werkzeug.exceptions import (
    BadRequest,
    Forbidden,
    InternalServerError,
    NotFound,
    RequestEntityTooLarge,
    ServiceUnavailable,
    Unauthorized,
)
from werkzeug.middleware.proxy_fix import ProxyFix

import im_db_backend.clients
import im_db_backend.configuration
import im_db_backend.configuration.containers as containers
import im_db_backend.DAL
import im_db_backend.resources
from im_db_backend.app.routes import initialize_routes
from im_db_backend.configuration.swagger import (
    SWAGGER_CONFIG,
    SWAGGER_TEMPLATE,
)


def create_application(application_containers=None):
    app = Flask(__name__)
    app.wsgi_app = ProxyFix(app.wsgi_app)  # noqa

    if not application_containers:
        application_containers = containers.ApplicationContainers()

        application_containers.wire(
            packages=[
                im_db_backend.clients,
                im_db_backend.configuration,
                im_db_backend.DAL,
                im_db_backend.resources,
            ]
        )

    secrets = application_containers.configuration.secrets()
    config_params = application_containers.configuration.config_params()

    app.config.from_mapping(
        SECRET_KEY=secrets.DB_PASSWORD,
        SQLALCHEMY_DATABASE_URI=(
            f"mysql+mysqlconnector://{config_params.DB_USERNAME}:{secrets.DB_PASSWORD}"
            f"@{config_params.DB_HOST}/{config_params.DB_DATABASE}"
            # f"@{config_params.DB_HOST}/{config_params.DB_DATABASE}?"
            # "use_pure=yes&ssl_verify_cert=yes&"
            # f"ssl_cert={config_params.DB_SSL_CERT_PATH}&"
            # f"ssl_key={config_params.DB_SSL_PRIVATE_KEY_PATH}&"
            # f"ssl_ca={config_params.DB_SSL_CA_CERT_PATH}"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SWAGGER=SWAGGER_CONFIG,
    )

    if config_params.is_development():
        Swagger(app, template=SWAGGER_TEMPLATE)

    initialize_routes(app=app, url_prefix="/service/api")

    # app.logger = application_containers.app.logger_singleton()
    # app.logger.propagate = False

    database = application_containers.app.database_singleton()
    app.containers = application_containers

    database.init_app(app)

    init_handlers(app)

    return app


def init_handlers(application):
    @application.after_request
    def after_request_handler(response: Response):
        message = {
            "message": f"{request.method} {request.url} {response.status_code}",
            "request": {"url": request.url, "method": request.method},
            "response": {"status_code": response.status_code},
        }

        if response.status_code in (
            BadRequest.code,
            Forbidden.code,
            InternalServerError.code,
            NotFound.code,
            RequestEntityTooLarge.code,
            ServiceUnavailable.code,
            Unauthorized.code,
        ):
            response_json = response.json

            message["response"]["data"] = response_json  # type: ignore

        # application.logger.info(message)

        return response
