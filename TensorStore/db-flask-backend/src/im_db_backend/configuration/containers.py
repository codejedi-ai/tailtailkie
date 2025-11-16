from dependency_injector.containers import DeclarativeContainer
from dependency_injector.providers import Container, Factory, Object, Singleton


class CoreContainers(DeclarativeContainer):
    import flask_sqlalchemy
    import requests
    database_singleton = Singleton(flask_sqlalchemy.SQLAlchemy)
    request_client = Object(requests)


class RepositoryContainers(DeclarativeContainer):
    import im_db_backend.DAL.repositories.entry_repository as _entry_repository
    import im_db_backend.DAL.repositories.imdb_repository as _imdb_repository

    entry_repository = Factory(_entry_repository.EntryRepository)
    imdb_repository = Factory(_imdb_repository.ImdbRepository)


class ConfigurationContainers(DeclarativeContainer):
    import im_db_backend.configuration.config_params as _config_params
    import im_db_backend.configuration.secrets as _secrets

    config_params = Singleton(_config_params.ConfigParams)
    secrets = Singleton(_secrets.Secrets)


class ServiceContainers(DeclarativeContainer):
    import im_db_backend.resources.authenticate.services as _auth_service
    import im_db_backend.resources.build_version.services as _build_version_service
    import im_db_backend.resources.incident.services as _imdb_service
    import im_db_backend.resources.jiraimport.services as _jiraimport_service
    import im_db_backend.resources.clerk_auth.services as _clerk_auth_service
    import im_db_backend.resources.datasets.services as _dataset_service
    import im_db_backend.resources.upload.services as _upload_service

    authenticate_service = Factory(_auth_service.AuthenticateService)
    build_version_service = Factory(_build_version_service.BuildVersionService)
    imdb_service = Factory(_imdb_service.ImdbService)
    jira_service = Factory(_jiraimport_service.JiraService)
    clerk_auth_service = Factory(_clerk_auth_service.ClerkAuthService)
    dataset_service = Factory(_dataset_service.DatasetService)
    upload_service = Factory(_upload_service.UploadService)


class ApplicationContainers(DeclarativeContainer):
    app = Container(CoreContainers)
    configuration = Container(ConfigurationContainers)
    repositories = Container(RepositoryContainers)
    services = Container(ServiceContainers)
