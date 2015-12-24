from urllib.request import urlopen
from urllib.parse import quote
from json import *

msg = quote(dumps({"cmd": "getDatasetManifest", "status":"request", "callback":"", "payload": "DEMOdz"}))
request = "http://localhost:4019?jsonMsg='%s'" % msg
rawResult = urlopen(request).read()
result = loads(rawResult.decode())   # bytes.decode()
payload = result["payload"]

fieldNames = list(payload.keys())
assert(len(fieldNames) == 4)
assert(fieldNames.index("mtx") >= 0)
assert(fieldNames.index("colnames") >= 0)
assert(fieldNames.index("rownames") >= 0)
assert(fieldNames.index("datasetName") >= 0)

assert(payload["datasetName"][0] == "DEMOdz")
print(True)

