from datetime import datetime, timedelta
from http import HTTPStatus
from time import sleep

import requests
from dependency_injector.wiring import Provide, inject
from flask import request, session

from im_db_backend.common.exceptions import APIException
from im_db_backend.DAL.models.base import entity_to_dict


class ImdbService:
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

    def get_status(self):
        print("get_status")
        return self.imdb_repository.check_connection()

    def querry(self):
        result = self.imdb_repository.get_last_incident()

        if not result:
            message = "Could not find incident data."

            # self.logger.error(message)

            raise APIException(
                payload={"message": message},
                status_code=int(HTTPStatus.NOT_FOUND),
            )

        return entity_to_dict(result)

    def get_all_ims(self):
        result = self.imdb_repository.get_all_ims()
        return result

    def get_im(self, im):
        result = self.imdb_repository.get_entries_with_im(im)
        return result

    def imdb_data(self, incident):
        self.imdb_repository.add_incident(incident_data=incident)
