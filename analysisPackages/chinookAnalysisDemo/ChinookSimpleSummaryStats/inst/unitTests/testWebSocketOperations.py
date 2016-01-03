import sys
import time
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:4001")

payload = [5.4964085, 0.7883715, 6.4879698, 4.9685336, 7.1878731]

msg = dumps({"cmd": "numericVectorSummaryStats", "status":"request", "callback":"", "payload": payload})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
#print payload
assert(payload["max"]  == 7.1879)
assert(payload["min"]  == 0.7884)
assert(payload["sd"]   == 2.4993)
assert(payload["mean"] == 4.9858)
print (True)
