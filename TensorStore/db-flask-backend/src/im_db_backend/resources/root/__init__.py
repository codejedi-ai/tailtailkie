import json
from http import HTTPStatus

from flasgger import SwaggerView
from flask import Response

from im_db_backend.resources.root.definitions import definitions


class Root(SwaggerView):
    definitions = definitions
    # testing 1

    def get(self):
        return Response(
            response=json.dumps("OK from March 3 2023"),
            content_type="application/json",
            status=int(HTTPStatus.OK),
        )
