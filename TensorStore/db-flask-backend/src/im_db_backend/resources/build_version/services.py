from dependency_injector.wiring import Provide, inject


class BuildVersionService:
    @inject
    def __init__(
        self,
        # logger=Provide["app.logger_singleton"],
        config_params=Provide["configuration.config_params"],
    ):
        # self.logger = logger
        self.config_params = config_params

    def get_build_version(self):
        version = self.config_params.BUILD_VERSION

        # self.logger.info(f"Current version: {version}")

        return version
