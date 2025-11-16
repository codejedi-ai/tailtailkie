from http import HTTPStatus

from marshmallow import ValidationError

from im_db_backend.common.exceptions import APIException


def validate_value_against_const(field_name, value, const):
    allowed_values = []

    for attribute, attribute_value in vars(const).items():
        if attribute.startswith("__"):
            continue

        allowed_values.append(attribute_value)

    if value.lower() not in allowed_values:
        raise ValidationError(
            f"Invalid value provided for {field_name} field. " f"Allowed values: {allowed_values}")


def validate_payload(payload, schema):
    errors = schema.validate(payload)

    if errors:
        raise APIException(
            status_code=int(HTTPStatus.BAD_REQUEST),
            payload=errors,
        )

    return schema.load(payload)
