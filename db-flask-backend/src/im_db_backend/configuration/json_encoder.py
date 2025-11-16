import datetime
import json


class JsonEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime.date, datetime.time, datetime.datetime)):
            return o.isoformat()

        try:
            return json.JSONEncoder.default(self, o)
        except TypeError:
            return str(o)

    @staticmethod
    def serialize_collection(collection):
        return [json.loads(row, cls=JsonEncoder) for row in collection]
