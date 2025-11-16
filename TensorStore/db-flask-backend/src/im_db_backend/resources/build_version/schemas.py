from marshmallow import Schema
from marshmallow.fields import String


class BuildVersionGETResponse(Schema):
    build_version = String(required=True)
