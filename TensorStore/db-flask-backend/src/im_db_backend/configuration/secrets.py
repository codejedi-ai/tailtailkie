import os
from time import time
from types import FunctionType, MethodType

from im_db_backend.common.exceptions import SecretException


class Secrets:
    is_set = False
    last_update_timestamp = None

    FLASK_SECRET = None

    DB_PASSWORD = None
    JIRA_USERNAME = None
    JIRA_PASSWORD = None

    @classmethod
    def set_secrets(cls) -> None:

        for attribute, value in vars(cls).items():
            if (
                attribute.startswith("__")
                or attribute == "is_set"
                or attribute == "last_update_timestamp"
                or isinstance((getattr(cls, attribute)), (MethodType, FunctionType))
            ):
                continue

            secret_value = os.getenv(attribute, None)

            if secret_value is None:
                raise SecretException(
                    f"Missing value for '{attribute}' secret")

            setattr(cls, attribute, secret_value)

            cls.last_update_timestamp = time()


if not Secrets.is_set:
    Secrets.set_secrets()

    Secrets.is_set = True
