import sys
import time
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:4019")
msg = dumps({"cmd": "getDatasetManifest", "status":"request", "callback":"", "payload": "DEMOdz"})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
fieldNames = list(payload.keys())
assert(len(fieldNames) == 5)
assert(fieldNames.index("mtx") >= 0)
assert(fieldNames.index("colnames") >= 0)
assert(fieldNames.index("rownames") >= 0)
assert(fieldNames.index("datasetName") >= 0)

assert(payload["datasetName"] == "DEMOdz")
print(True)

