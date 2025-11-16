import json
from datetime import datetime
from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response, request
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.incident.schemas import IncidentGETResponse


class Imdb(MethodView):
    @inject
    def __init__(
        self,
        imdb_service=Provide["services.imdb_service"],
    ) -> None:
        self.imdb_service = imdb_service

    def get(self):
        print("get")
        incident_data = request.args.get("ticken_id")
        print(incident_data)
        # response_json = IncidentGETResponse().dumps({**self.imdb_service.querry()})
        response_json = self.imdb_service.get_im(incident_data)[0]
        # print("response_json is {response_json}".format(
        response_json = response_json.to_dict()
        # iterate through response_json and change all datetime to string
        for key, value in response_json.items():
            if isinstance(value, datetime):
                response_json[key] = value.strftime("%Y-%m-%d %H:%M:%S")

        print("response_json is {response_json}".format(
            response_json=response_json))

        return Response(
            response=json.dumps(response_json),
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )

    def post(self):
        incident_data = request.json
        # print "incident_data {request.args}"
        # all string formating

        print("args is {args}".format(args=request.args))
        # self.imdb_service.imdb_data(incident_data)

        return Response(
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )
