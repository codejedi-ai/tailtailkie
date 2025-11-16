from dependency_injector.wiring import Provide, inject

from im_db_backend.common.exceptions import RepositoryException
from im_db_backend.DAL.models.entry import Entry
from im_db_backend.DAL.repositories.base_repository import BaseRepository


class EntryRepository(BaseRepository):
    @inject
    def __init__(
        self,
        # logger=Provide["app.logger_singleton"],
        database=Provide["app.database_singleton"],
    ):
        # logger=logger, database=database)
        super().__init__(model=Entry, database=database)

    def add_entry(self, entry_data):
        return super().add_entity(entity_data=entry_data)

    def get_all_entries(self):
        return super().get_all_entities()

    def delete_entry_by_id(self, entry_id):
        return super().delete_entity_by_id(entity_id=entry_id)

    def get_entries_since_date(self, from_date):
        try:
            return self.database.session.query(Entry).filter(Entry.created_at >= from_date).all()
        except Exception:
            # self.logger.exception(
            #    "An error has occurred while attempting to retrieve entries.")

            raise RepositoryException("Failed to retrieve entries since date.")
        finally:
            self.database.session.close()
