from urllib.request import urlopen
from urllib.parse import quote
from json import *

<<<<<<< HEAD
payload = {"datasetName": "DEMOdz", "matrixName": "mtx.mrna.ueArray", "geneset": "random.40"}
=======
payload = {"datasetName": "DEMOdz", "matrixName": "mtx.mrna.ueArray"};
msg = quote(dumps({"cmd": "createPCA", "status": "request", "callback": "", "payload": payload}))
request = "http://localhost:4009?jsonMsg='%s'" % msg
print(request)
rawResult = urlopen(request).read()
result = loads(rawResult.decode())
payload = result["payload"]

   # typical response: "PCA(DEMOdz(), 'mtx.mrna.ueArray') version 1.0.13 created"
   # check for just the initial portion of this response string
   
assert(payload.index("PCA(DEMOdz") == 0)

# request calculation of PCA on the full dataset, no gene or sample subsets specified
payload = {}
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261

# 'quote' does url encoding, e.g., " " becomes "%20"
msg = quote(dumps({"cmd": "calculatePCA", "status": "request", "callback":"", "payload": payload}))

request = "http://localhost:4009?jsonMsg='%s'" % msg
print(request)
rawResult = urlopen(request).read()
result = loads(rawResult.decode())

payload = result["payload"]
fieldNames = list(payload.keys())
assert(fieldNames.index("ids") >= 0)
assert(fieldNames.index("maxValue") >= 0)
assert(fieldNames.index("scores") >= 0)
assert(fieldNames.index("importance.PC1") >= 0)
assert(fieldNames.index("importance.PC2") >= 0)
assert(len(payload["scores"]) == len(payload["ids"]))
