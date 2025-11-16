from marshmallow import Schema
from marshmallow.fields import Nested, String

from im_db_backend.resources.authenticate.schemas import AuthenticatePOSTResponse


class ConfigurationGETResponse(Schema):
    user_info = Nested(AuthenticatePOSTResponse)
    client_id = String(required=True)
