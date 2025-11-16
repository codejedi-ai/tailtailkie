from im_db_backend.resources.authenticate import Authenticate
from im_db_backend.resources.build_version import BuildVersion
from im_db_backend.resources.configuration import Configuration
from im_db_backend.resources.incident import Imdb
from im_db_backend.resources.jiraimport import JiraImport
from im_db_backend.resources.root import Root
from im_db_backend.resources.status import Status
from im_db_backend.resources.datasets import Datasets
from im_db_backend.resources.upload import Upload


def initialize_routes(app, url_prefix):
    def get_rule(url):
        return f"{url_prefix}{url}"

    def add_route(rule, endpoint, resource):
        app.add_url_rule(
            rule=get_rule(rule),
            endpoint=endpoint,
            view_func=resource.as_view(name=endpoint),
        )

    # sort the following comments by alphabetical order of the endpoint
    add_route(
        rule="/authenticate", endpoint="authenticate", resource=Authenticate
    )
    add_route(
        rule="/configuration", endpoint="configuration", resource=Configuration
    )
    add_route(rule="/datasets", endpoint="datasets", resource=Datasets)
    add_route(rule="/datasets/<dataset_id>", endpoint="dataset", resource=Datasets)
    add_route(rule="/upload", endpoint="upload", resource=Upload)
    add_route(rule="/incident", endpoint="imdb", resource=Imdb)
    add_route(rule="/jiraimport", endpoint="jiraimport", resource=JiraImport)
    add_route(rule="/", endpoint="root", resource=Root)
    add_route(rule="/status", endpoint="status", resource=Status)
    add_route(rule="/version", endpoint="version", resource=BuildVersion)
