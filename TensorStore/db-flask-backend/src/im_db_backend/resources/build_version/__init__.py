from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.build_version.schemas import BuildVersionGETResponse


class BuildVersion(MethodView):
    @inject
    def __init__(
        self,
        build_version_service=Provide["services.build_version_service"],
    ) -> None:
        self.build_version_service = build_version_service

    def get(self):
        response_json = BuildVersionGETResponse().dumps(
            {"build_version": self.build_version_service.get_build_version()},
        )

        return Response(
            response=response_json,
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )
