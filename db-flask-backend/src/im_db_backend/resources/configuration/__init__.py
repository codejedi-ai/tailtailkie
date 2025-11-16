from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response, session
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.configuration.schemas import ConfigurationGETResponse


class Configuration(MethodView):
    @inject
    def __init__(
        self,
        config_params=Provide["configuration.config_params"],
    ) -> None:
        self.config_params = config_params

    def get(self):
        response_json = ConfigurationGETResponse().dumps(
            {
                "user_info": session.get("user_info"),
                "client_id": self.config_params.OAUTH_CLIENT_ID,
            }
        )

        return Response(
            response=response_json,
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )
