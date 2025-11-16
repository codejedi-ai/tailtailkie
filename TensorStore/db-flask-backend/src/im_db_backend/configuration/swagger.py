import os

import im_db_backend

SWAGGER_CONFIG = {
    "title": "Swagger API",
    "uiversion": 3,
    "doc_dir": f"{os.path.dirname(im_db_backend.__file__)}/swagger/",
    "specs_route": "/service/api/swagger/",
    "specs": [{"endpoint": "specifications", "route": "/service/api/specifications.json"}],
    "static_url_path": "/service/api/flasgger_static",
}

SWAGGER_TEMPLATE = {}
