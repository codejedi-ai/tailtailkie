from http import HTTPStatus

from werkzeug.exceptions import BadRequest, Forbidden, InternalServerError, NotFound, Unauthorized


class BridgeException(Exception):
    def __init__(self, message):
        super().__init__(message)

        self.message = message


class EmptyEnvironmentVariableException(BridgeException):
    pass


class SecretException(BridgeException):
    pass


class RepositoryException(BridgeException):
    pass


class APIException(Exception):
    def __init__(self, status_code: int, payload: dict) -> None:
        super().__init__()

        exceptions = {
            int(HTTPStatus.FORBIDDEN): Forbidden,
            int(HTTPStatus.BAD_REQUEST): BadRequest,
            int(HTTPStatus.NOT_FOUND): NotFound,
            int(HTTPStatus.UNAUTHORIZED): Unauthorized,
        }
        selected_exception = exceptions.get(status_code, InternalServerError)
        data = payload if payload else {"message": "The application has encountered an unexpected error"}

        api_exception = selected_exception()
        api_exception.data = data

        raise api_exception
