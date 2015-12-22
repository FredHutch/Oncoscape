from urllib2 import *
from json import *

payload = {"datasetName": "DEMOdz", "matrixName": "mtx.mrna.ueArray"};
msg = quote(dumps({"cmd": "createPCA", "status": "request", "callback": "", "payload": payload}))
request = "http://localhost:4009?jsonMsg='%s'" % msg
print request
rawResult = urlopen(request).read()
result = loads(rawResult)
payload = result["payload"]

   # typical response: "PCA(DEMOdz(), 'mtx.mrna.ueArray') version 1.0.13 created"
   # check for just the initial portion of this response string
   
assert(payload.index("PCA(DEMOdz") == 0)

# request calculation of PCA on the full dataset, no gene or sample subsets specified
payload = {}

# 'quote' does url encoding, e.g., " " becomes "%20"
msg = quote(dumps({"cmd": "calculatePCA", "status": "request", "callback":"", "payload": payload}))

request = "http://localhost:4009?jsonMsg='%s'" % msg
print request
rawResult = urlopen(request).read()
result = loads(rawResult)

payload = result["payload"]
fieldNames = payload.keys()
assert(fieldNames.index("ids") >= 0)
assert(fieldNames.index("maxValue") >= 0)
assert(fieldNames.index("scores") >= 0)
assert(fieldNames.index("importance.PC1") >= 0)
assert(fieldNames.index("importance.PC2") >= 0)
assert(len(payload["scores"]) == len(payload["ids"]))
