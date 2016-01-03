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


#----------------------------
# what messages can be sent?
#----------------------------
msg = dumps({"cmd": "getRegisteredMessageNames", "status":"request", "callback":"", "payload": ""})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
assert(payload.index("getDatasetItemNames") >= 0)

#---------------------------------------
# what  DEMOdz data items are available?
#---------------------------------------
msg = dumps({"cmd": "getDatasetItemNames", "status":"request", "callback":"", "payload": ""})
ws.send(msg)
result = loads(ws.recv())
itemNames = result["payload"]
assert(len(itemNames) > 3)
   # ensure that the copy number matrix is among them
assert(itemNames.index("mtx.cn") >= 0)

#---------------------------------------
# request mtx.cn
#---------------------------------------
msg = dumps({"cmd": "getDatasetItemByName", "status":"request", "callback":"", "payload": "mtx.cn"})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
assert(list(payload.keys()) == ['mtx.cn'])
item = payload["mtx.cn"]
fieldNames = list(item.keys())
fieldNames.sort()
assert(fieldNames == ['colnames', 'datasetName', 'mtx', 'rownames', 'variables'])
mtx = item["mtx"]
rowCount = len(mtx)
colCount = len(mtx[0])
assert(rowCount == 20)
assert(colCount == 64)

#-----------------------------------------
# request mtx.cn, mtx.mut, and sampleJSON
#-----------------------------------------
itemsRequested = ["mtx.cn", "mtx.mut", "sampleJSON"]
#itemsRequested = ["mtx.mut"]
msg = dumps({"cmd": "getDatasetItemByName", "status":"request", "callback":"", "payload": itemsRequested})
ws.send(msg)
result = loads(ws.recv())
payload = result["payload"]
itemsReturned = list(payload.keys())
itemsReturned.sort()
assert(itemsReturned == itemsRequested)

  # ensure that mtx.cn is legit

item = payload["mtx.cn"]
fieldNames = list(item.keys())
fieldNames.sort()
assert(fieldNames == ['colnames', 'datasetName', 'mtx', 'rownames', 'variables'])
mtx = item["mtx"]
rowCount = len(mtx)
colCount = len(mtx[0])
assert(rowCount == 20)
assert(colCount == 64)

  # ensure that mtx.mut is legit

item = payload["mtx.mut"]
fieldNames = list(item.keys())
fieldNames.sort()
assert(fieldNames == ['colnames', 'datasetName', 'mtx', 'rownames', 'variables'])
mtx = item["mtx"]
rowCount = len(mtx)
colCount = len(mtx[0])
assert(rowCount == 20)
assert(colCount == 64)
   # very few mutations here, but direct examination in R tells reveals mtx.mut[17,5]:
assert(mtx[16][4] == 'A289T,V774M')



print(True)



