"""
   isort:skip_file
"""

from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from flask_migrate import Migrate

from im_db_backend.configuration.config_params import ConfigParams
from im_db_backend.configuration.secrets import Secrets


app = Flask(__name__)

app.config.from_mapping(
    SECRET_KEY=Secrets.DB_PASSWORD,
    SQLALCHEMY_DATABASE_URI=(
        f"mysql+mysqlconnector://{ConfigParams.DB_USERNAME}:{Secrets.DB_PASSWORD}"
        f"@{ConfigParams.DB_HOST}/{ConfigParams.DB_DATABASE}"
        # f"@{ConfigParams.DB_HOST}/{ConfigParams.DB_DATABASE}?"
        # "use_pure=yes&ssl_verify_cert=yes&"
        # f"ssl_cert={ConfigParams.DB_SSL_CERT_PATH}&"
        # f"ssl_key={ConfigParams.DB_SSL_PRIVATE_KEY_PATH}&"
        # f"ssl_ca={ConfigParams.DB_SSL_CA_CERT_PATH}"
    ),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
)


with app.app_context():
    # We need to import models, so that changes can be picked up by migration
    from im_db_backend.DAL.models.base import Base
    from im_db_backend.DAL.models.imdb import Imdb

    database = SQLAlchemy(model_class=Base)

    database.init_app(app)

    migrate = Migrate(app, database)
