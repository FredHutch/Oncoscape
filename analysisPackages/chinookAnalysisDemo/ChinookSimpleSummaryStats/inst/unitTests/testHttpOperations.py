from urllib2 import *
from json import *

payload = [5.4964085, 0.7883715, 6.4879698, 4.9685336, 7.1878731]
msg = quote(dumps({"cmd": "numericVectorSummaryStats", "status": "request", "callback": "", "payload": payload}))
request = "http://localhost:4001?jsonMsg='%s'" % msg
rawResult = urlopen(request).read()
result = loads(rawResult)
payload = result["payload"]
assert(payload["max"][0]  == 7.1879)
assert(payload["min"][0]  == 0.7884)
assert(payload["sd"][0]   == 2.4993)
assert(payload["mean"][0] == 4.9858)
print "True"