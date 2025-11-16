from datetime import datetime

from im_db_backend.common.exceptions import RepositoryException


class BaseRepository:
    def __init__(self, model,  # logger,
                 database):
        self.model = model
        # self.logger = logger
        self.database = database

    # check is there database connection
    def check_connection(self):

        try:
            self.database.session.execute("SELECT 1")
        except Exception:
            # self.logger.exception(
            #     "An error has occurred while attempting to check database connection."
            # )

            # raise RepositoryException("Failed to check database connection")
            return {
                "is_connected": False,
                "message": "Connection to database failed",
            }
        finally:
            self.database.session.close()
        return {
            "is_connected": True,
            "message": "Connection to database succeeded",
        }

    def add_entity(self, entity_data):
        try:
            entity = self.model(
                **{
                    **entity_data,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                }
            )

            self.database.session.add(entity)
            self.database.session.commit()

            return entity.id if entity else 0

        except Exception:
            # self.logger.exception(
            #                "An error has occurred while attempting to persist new entity."
            #            )

            self.database.session.rollback()

            raise RepositoryException("Failed to persist entity")
        finally:
            self.database.session.close()

    def get_all_entities(self):
        try:
            return [
                row.to_dict()
                for row in self.database.session.query(self.model).all()
            ]

        except Exception:
            # self.logger.exception(
            #     "An error has occurred while attempting to retrieve all entities.",
            # )

            raise RepositoryException("Failed to retrieve all entities")
        finally:
            self.database.session.close()

    def get_entity_by_id(self, entity_id):
        try:
            return self.database.session.query(self.model).get(entity_id)

        except Exception:
            # self.logger.exception(
            #     "An error has occurred while attempting to retrieve an entity by id.",
            # )

            raise RepositoryException("Failed to retrieve an entity by id")
        finally:
            self.database.session.close()

    def update_entity_by_id(self, entity_id, **kwargs):
        try:
            entity = (
                self.database.session.query(self.model)
                .with_for_update()
                .get(entity_id)
            )

            if entity is None:
                return None

            number_of_columns_updated = 0

            for key, value in kwargs.items():
                if key == "entity_id" or key == "id":
                    continue

                if hasattr(entity, key):
                    setattr(entity, key, value)
                    number_of_columns_updated += 1

            if number_of_columns_updated == 0:
                raise RepositoryException(
                    "Failed to update entity, no matching keys found"
                )

            setattr(entity, "updated_at", datetime.now())

            self.database.session.commit()

            self.database.session.refresh(entity)
            self.database.session.expunge(entity)

            return entity

        except Exception:
            # self.logger.exception(
            #     "An error has occurred while attempting to update an entity.",
            # )

            self.database.session.rollback()

            raise RepositoryException("Failed to update an entity")
        finally:
            self.database.session.close()

    def delete_entity_by_id(self, entity_id):
        try:
            entity = (
                self.database.session.query(self.model)
                .with_for_update()
                .get(entity_id)
            )

            if entity is None:
                return None

            setattr(entity, "is_deleted", True)
            setattr(entity, "updated_at", datetime.now())

            self.database.session.commit()

        except Exception:
            # self.logger.exception(
            #     "An error has occurred while attempting to delete an entity.",
            # )

            self.database.session.rollback()

            raise RepositoryException("Failed to delete an entity")

        finally:
            self.database.session.close()
