import sys

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

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
    database = SQLAlchemy()

    database.init_app(app)

    try:
        result = database.engine.execute("SHOW TABLES;")
    except Exception as ex:
        print(ex)

        sys.exit(1)
