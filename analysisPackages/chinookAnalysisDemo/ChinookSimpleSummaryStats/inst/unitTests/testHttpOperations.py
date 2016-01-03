from urllib.request import urlopen
from urllib.parse import quote
from json import *

payload = [5.4964085, 0.7883715, 6.4879698, 4.9685336, 7.1878731]
msg = quote(dumps({"cmd": "numericVectorSummaryStats", "status": "request", "callback": "", "payload": payload}))
request = "http://localhost:4001?jsonMsg='%s'" % msg
rawResult = urlopen(request).read()
result = loads(rawResult.decode())   # bytes.decode()
payload = result["payload"]
assert(payload["max"]  == 7.1879)
assert(payload["min"]  == 0.7884)
assert(payload["sd"]   == 2.4993)
assert(payload["mean"] == 4.9858)
print (True)
