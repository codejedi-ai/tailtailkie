from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response, request
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.datasets.services import DatasetService


class Datasets(MethodView):
    @inject
    def __init__(
        self,
        dataset_service=Provide["services.dataset_service"],
    ) -> None:
        self.dataset_service = dataset_service

    def get(self, dataset_id: str = None):
        """GET /datasets or GET /datasets/<id>"""
        import json
        
        if dataset_id:
            # Get single dataset
            dataset = self.dataset_service.get_dataset(dataset_id)
            return Response(
                response=json.dumps(dataset),
                content_type=ContentTypes.JSON,
                status=int(HTTPStatus.OK),
            )
        else:
            # List datasets
            search = request.args.get("search")
            user_id = request.args.get("userId")
            format = request.args.get("format")
            limit = int(request.args.get("limit", 20))
            offset = int(request.args.get("offset", 0))
            
            result = self.dataset_service.list_datasets(
                search=search,
                user_id=user_id,
                format=format,
                limit=limit,
                offset=offset,
            )
            
            return Response(
                response=json.dumps(result),
                content_type=ContentTypes.JSON,
                status=int(HTTPStatus.OK),
            )

    def post(self):
        """POST /datasets - Create a new dataset"""
        data = request.get_json()
        if not data:
            return Response(
                response='{"error": "No data provided"}',
                content_type=ContentTypes.JSON,
                status=int(HTTPStatus.BAD_REQUEST),
            )
        
        dataset = self.dataset_service.create_dataset(data)
        
        import json
        return Response(
            response=json.dumps(dataset),
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.CREATED),
        )

