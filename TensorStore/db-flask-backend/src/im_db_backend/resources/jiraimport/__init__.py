from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response, request
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.jiraimport.schemas import JiraImportPOSTResponse


class JiraImport(MethodView):
    @inject
    def __init__(
        self,
        jira_service=Provide["services.jira_service"],
    ) -> None:
        self.jira_service = jira_service

    def post(self):
        # response_json = "true from imdb if conect and falst otherwise"
        # incident_data = request.args.get("ticken_id")
        print(request.json)
        response_json = request.json
        self.jira_service.import_incidents(response_json["jira_id"])
        return Response(
            response=response_json,
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )
