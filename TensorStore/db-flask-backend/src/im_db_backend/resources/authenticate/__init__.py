from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.authenticate.schemas import (
    AuthenticatePOSTResponse,
)


class Authenticate(MethodView):
    @inject
    def __init__(
        self,
        authenticate_service=Provide["services.authenticate_service"],
    ) -> None:
        self.authenticate_service = authenticate_service

    def get(self):
        self.authenticate_service.logout()

        return Response(status=int(HTTPStatus.OK))

    def post(self):
        response_json = AuthenticatePOSTResponse().dumps(
            {**self.authenticate_service.authenticate()},
        )

        return Response(
            response=response_json,
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )
