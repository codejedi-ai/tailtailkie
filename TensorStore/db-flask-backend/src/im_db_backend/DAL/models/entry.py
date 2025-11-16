from sqlalchemy import Column, DateTime, Numeric, String

from im_db_backend.DAL.models.base import Base, entity_to_dict


class Entry(Base):
    __tablename__ = "entry"

    date = Column(DateTime, nullable=False)
    email = Column(String(128), nullable=False)
    full_name = Column(String(128), nullable=False)
    hours = Column(Numeric, nullable=False)
    project = Column(String(256), nullable=False)
    stream = Column(String(512), nullable=False)
    team = Column(String(64), nullable=False)
    uid = Column(String(128), nullable=False)

    def to_dict(self):
        return entity_to_dict(self)
