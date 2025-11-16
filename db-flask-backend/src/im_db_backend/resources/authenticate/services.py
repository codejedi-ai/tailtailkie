from http import HTTPStatus

from cachecontrol import CacheControl
from dependency_injector.wiring import Provide, inject
from flask import request, session
from google.auth.transport.requests import Request
from google.oauth2 import id_token

from im_db_backend.common.exceptions import APIException


class AuthenticateService:
    @inject
    def __init__(
        self,
        # logger=Provide["app.logger_singleton"],
        request_client=Provide["app.request_client"],
        config_params=Provide["configuration.config_params"],
    ):
        # self.logger = logger
        self.request_client = request_client
        self.config_params = config_params

    @staticmethod
    def logout():
        session.clear()

    def authenticate(self):
        request_json = request.get_json()
        token = request_json.get("token")

        if not token:
            raise APIException(
                status_code=int(HTTPStatus.UNAUTHORIZED),
                payload={"message": "Failed to retrieve authorization token."},
            )

        cached_session = CacheControl(self.request_client.session())
        token_request = Request(session=cached_session)
        try:
            credentials = id_token.verify_oauth2_token(
                id_token=token,
                request=token_request,
                audience=self.config_params.OAUTH_CLIENT_ID,
            )
        except ValueError as ex:
            message = "Failed to verify token."

            # self.logger.exception(message)

            raise APIException(
                payload={"message": message},
                status_code=int(HTTPStatus.UNAUTHORIZED),
            )

        email = credentials.get("email")

        # Authorization can be configured via environment variables or database
        # For now, all authenticated users are allowed

        session["user_info"] = {
            "first_name": credentials.get("given_name"),
            "last_name": credentials.get("family_name"),
            "email": email,
            "picture": credentials.get("picture"),
        }

        return session["user_info"]
