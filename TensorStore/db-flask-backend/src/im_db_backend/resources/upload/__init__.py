from http import HTTPStatus

from dependency_injector.wiring import Provide, inject
from flask import Response, request
from flask.views import MethodView

from im_db_backend.common.constants.content_types import ContentTypes
from im_db_backend.resources.upload.services import UploadService


class Upload(MethodView):
    @inject
    def __init__(
        self,
        upload_service=Provide["services.upload_service"],
    ) -> None:
        self.upload_service = upload_service

    def post(self):
        """POST /upload - Upload tensor files"""
        import json
        
        # Check if files are in the request
        if 'files' not in request.files:
            return Response(
                response=json.dumps({"error": "No files provided"}),
                content_type=ContentTypes.JSON,
                status=int(HTTPStatus.BAD_REQUEST),
            )
        
        files = request.files.getlist('files')
        if not files or len(files) == 0:
            return Response(
                response=json.dumps({"error": "No files uploaded"}),
                content_type=ContentTypes.JSON,
                status=int(HTTPStatus.BAD_REQUEST),
            )
        
        result = self.upload_service.upload_files(files)
        
        return Response(
            response=json.dumps(result),
            content_type=ContentTypes.JSON,
            status=int(HTTPStatus.OK),
        )

