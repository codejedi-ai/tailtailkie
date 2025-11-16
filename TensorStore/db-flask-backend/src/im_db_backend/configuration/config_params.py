import os

from im_db_backend.common.constants.deployment_environments import (
    DeploymentEnvironments,
)
from im_db_backend.common.exceptions import EmptyEnvironmentVariableException


class ConfigParams:
    is_set = False

    BUILD_VERSION = None
    ENVIRONMENT = None

    OAUTH_CLIENT_ID = None

    DB_HOST = None
    DB_DATABASE = None
    DB_PORT = None
    DB_USERNAME = None
    # DB_SSL_CA_CERT_PATH = None
    # DB_SSL_CERT_PATH = None
    # DB_SSL_PRIVATE_KEY_PATH = None

    @classmethod
    def is_production(cls):
        return cls.ENVIRONMENT.lower() == DeploymentEnvironments.PRODUCTION.value

    @classmethod
    def is_development(cls):
        return cls.ENVIRONMENT.lower() in [DeploymentEnvironments.DEV.value, DeploymentEnvironments.LOCAL.value]

    @classmethod
    def set_config_params(cls):
        for attribute, value in vars(cls).items():
            if attribute.startswith("__") or value is not None:
                continue

            value_from_env = os.getenv(attribute)

            if value_from_env is None:
                raise EmptyEnvironmentVariableException(
                    f"Missing value for '{attribute}' environment variable")

            cls.__update_attribute(attribute=attribute, value=value_from_env)

    @classmethod
    def __update_attribute(cls, attribute, value):
        setattr(cls, attribute, value)


if not ConfigParams.is_set:
    ConfigParams.set_config_params()

    ConfigParams.is_set = True
