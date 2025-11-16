from marshmallow import Schema
from marshmallow.fields import Date, Float, Integer, String


class JiraImportPOSTResponse(Schema):
    jira_id = String()
