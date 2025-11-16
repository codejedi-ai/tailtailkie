def is_string_value_true(string_value):
    if not string_value:
        return False

    return string_value.lower() in ["y", "yes", "true", "1"]
