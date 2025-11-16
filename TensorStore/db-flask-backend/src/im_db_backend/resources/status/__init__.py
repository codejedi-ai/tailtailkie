from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response, request
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.status.schemas import StatusGETResponse


class Status(MethodView):
    @inject
    def __init__(
        self,
        imdb_service=Provide["services.imdb_service"],
    ) -> None:
        self.imdb_service = imdb_service

    def get(self):
        # response_json = "true from imdb if conect and falst otherwise"
        response_json = StatusGETResponse().dumps(
            {**self.imdb_service.get_status()}
        )

        return Response(
            response=response_json,
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )
