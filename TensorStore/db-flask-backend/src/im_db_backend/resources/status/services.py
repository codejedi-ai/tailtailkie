from datetime import datetime, timedelta
from http import HTTPStatus
from time import sleep

import requests
from dependency_injector.wiring import Provide, inject
from flask import request, session

from im_db_backend.common.exceptions import APIException
from im_db_backend.DAL.models.base import entity_to_dict


class StatusService:
    @inject
    def __init__(
        self,
        # logger=Provide["app.logger_singleton"],
        config_params=Provide["configuration.config_params"],
        imdb_repository=Provide["repositories.imdb_repository"],
    ):
        # self.logger = logger
        self.config_params = config_params
        self.imdb_repository = imdb_repository

    def querry(self):
        result = self.imdb_repository.check_connection()
        return entity_to_dict(result)
