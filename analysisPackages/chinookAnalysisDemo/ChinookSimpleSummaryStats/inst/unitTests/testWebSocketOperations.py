import sys
import time
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:4001")

payload = range(1,10)
msg = dumps({"cmd": "numericVectorSummaryStats", "status":"request", "callback":"", "payload": payload})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
#print payload
assert(payload["max"][0] == 9)
assert(payload["sd"][0] == 2.7386)
assert(payload["min"][0] == 1)
assert(payload["mean"][0] == 5)
print "True"
