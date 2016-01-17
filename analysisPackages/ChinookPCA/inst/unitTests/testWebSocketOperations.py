import sys
import time
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:4009")

payload = {"datasetName": "DEMOdz", "matrixName": "mtx.mrna.ueArray", "geneset": "random.40"}
msg = dumps({"cmd": "calculatePCA", "status": "request", "callback":"", "payload": payload})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
fieldNames = list(payload.keys())
assert(fieldNames.index("ids") >= 0)
assert(fieldNames.index("maxValue") >= 0)
assert(fieldNames.index("scores") >= 0)
assert(fieldNames.index("importance.PC1") >= 0)
assert(fieldNames.index("importance.PC2") >= 0)
assert(len(payload["scores"]) == len(payload["ids"]))

