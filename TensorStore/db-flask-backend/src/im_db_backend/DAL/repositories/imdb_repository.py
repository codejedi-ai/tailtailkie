from dependency_injector.wiring import Provide, inject

from im_db_backend.common.exceptions import RepositoryException
from im_db_backend.DAL.models.imdb import Imdb
from im_db_backend.DAL.repositories.base_repository import BaseRepository


class ImdbRepository(BaseRepository):
    @inject
    def __init__(
        self,
        # logger=Provide["app.logger_singleton"],
        database=Provide["app.database_singleton"],
    ):
        # logger=logger, database=database)
        super().__init__(model=Imdb, database=database)

    def add_incident(self, incident_data):
        return super().add_entity(entity_data=incident_data)

    def get_all_entries(self):
        return super().get_all_entities()

    def delete_incident_by_id(self, incident_id):
        return super().delete_entity_by_id(entity_id=incident_id)

    def get_entries_since_date(self, from_date):
        try:
            return self.database.session.query(Imdb).filter(Imdb.created_at >= from_date).all()
        except Exception:
            # self.logger.exception(
            #    "An error has occurred while attempting to retrieve entries.")

            raise RepositoryException("Failed to retrieve entries since date.")
        finally:
            self.database.session.close()

    def get_entries_im(self):
        try:
            result = self.database.session.query(Imdb).all()
            ret = result
            return ret
        except Exception:
            # self.logger.exception(
            #    "An error has occurred while attempting to retrieve entries.")

            raise RepositoryException("Failed to retrieve entries since date.")
        finally:
            self.database.session.close()

    def get_entries_with_im(self, targetIM):
        try:
            result = self.database.session.query(
                Imdb).filter(Imdb.im == targetIM).all()
            ret = result
            return ret
        except Exception:
            # self.logger.exception(
            #    "An error has occurred while attempting to retrieve entries.")

            raise RepositoryException("Failed to retrieve entries since date.")
        finally:
            self.database.session.close()

    def get_last_incident(self):
        try:
            return self.database.session.query(Imdb).order_by(Imdb.id.desc()).first()
        except Exception:
            # self.logger.exception(
            #     "An error has occurred while attempting to retrieve last token.")

            raise RepositoryException("Failed to retrieve last token.")
        finally:
            self.database.session.close()
