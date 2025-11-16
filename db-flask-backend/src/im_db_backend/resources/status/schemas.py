from marshmallow import Schema
from marshmallow.fields import Boolean, String


class StatusGETResponse(Schema):
    is_connected = Boolean()
    message = String()
