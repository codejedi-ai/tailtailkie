from marshmallow import Schema
from marshmallow.fields import String


class AuthenticatePOSTResponse(Schema):
    first_name = String(required=True)
    email = String(required=True)
    picture = String(required=True)


class AuthenticatePOSTRequest(Schema):
    token = String(required=True)
