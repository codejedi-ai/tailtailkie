from im_db_backend.resources.authenticate.schemas import (
    AuthenticatePOSTRequest,
    AuthenticatePOSTResponse,
)
from im_db_backend.resources.build_version.schemas import (
    BuildVersionGETResponse,
)
from im_db_backend.resources.configuration.schemas import (
    ConfigurationGETResponse,
)
from im_db_backend.resources.incident.schemas import (
    IncidentGETRequest,
    IncidentGETResponse,
    IncidentPOSTRequest,
)
from im_db_backend.resources.jiraimport.schemas import JiraImportPOSTResponse
from im_db_backend.resources.status.schemas import StatusGETResponse

definitions = {
    "AuthenticatePOSTRequest": AuthenticatePOSTRequest,
    "AuthenticatePOSTResponse": AuthenticatePOSTResponse,
    "BuildVersionGETResponse": BuildVersionGETResponse,
    "ConfigurationGETResponse": ConfigurationGETResponse,
    "IncidentPOSTRequest": IncidentPOSTRequest,
    "IncidentGETResponse": IncidentGETResponse,
    "IncidentGETRequest": IncidentGETRequest,
    "JiraImportPOSTResponse": JiraImportPOSTResponse,
    "StatusGETResponse": StatusGETResponse,
}
