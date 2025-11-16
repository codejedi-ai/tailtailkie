from sqlalchemy import Boolean, Column, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base


class Base:
    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)


Base = declarative_base(cls=Base)


def entity_to_dict(entity):
    return {column.name: getattr(entity, column.name) for column in entity.__table__.columns}
