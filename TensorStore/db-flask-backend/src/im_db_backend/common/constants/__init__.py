from enum import Enum

helper_methods = ("get_attribute_names", "to_dict")


class BaseConstant(Enum):
    @classmethod
    def get_attribute_names(cls):
        return [key for key in dir(cls) if not key.startswith("__") and key not in helper_methods]

    @classmethod
    def get_attribute_values(cls):
        return [value.value for key, value in cls.__dict__.items() if key in cls.get_attribute_names()]

    @classmethod
    def get_attribute_name_by_value(cls, value):
        return next(
            (
                attribute_key
                for attribute_key, attribute_value in cls.__dict__.items()
                if attribute_key in cls.get_attribute_names() and attribute_value.value == value
            ),
            None,
        )

    @classmethod
    def to_dict(cls):
        return {key: value.value for key, value in cls.__dict__.items() if key in cls.get_attribute_names()}
