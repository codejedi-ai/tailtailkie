from http import HTTPStatus

from flask import session

from im_db_backend.common.exceptions import APIException


def authorized(method):
    def wrapper(*args, **kwargs):
        if "user_info" not in session:
            raise APIException(
                status_code=int(HTTPStatus.UNAUTHORIZED),
                payload={"message": "Failed to validate authorization state."},
            )
        else:
            return method(*args, **kwargs)

    return wrapper
