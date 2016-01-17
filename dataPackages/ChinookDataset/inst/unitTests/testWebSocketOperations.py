import sys
import time
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:4019")

#----------------------------------------------------------------------------------------------------
def testManifest():

  print("--- testManifest")
  print("    DEMOdz")
  payload = {"dataset": "DEMOdz"}
  msg = dumps({"cmd": "getDatasetManifest", "status":"request", "callback":"", "payload": payload})
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

  payload = {"dataset": "TCGAbrain"}
  msg = dumps({"cmd": "getDatasetManifest", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]
  fieldNames = list(payload.keys())
  assert(len(fieldNames) == 5)
  assert(fieldNames.index("mtx") >= 0)
  assert(fieldNames.index("colnames") >= 0)
  assert(fieldNames.index("rownames") >= 0)
  assert(fieldNames.index("datasetName") >= 0)
  assert(payload["datasetName"] == "TCGAbrain")

#----------------------------------------------------------------------------------------------------
def testAvailableMessages():

  msg = dumps({"cmd": "getRegisteredMessageNames", "status":"request", "callback":"", "payload": ""})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]
  print(payload)
  assert(payload.index("getDatasetItemNames") >= 0)
  assert(payload.index("getDatasetItemsByName") >= 0)
  assert(payload.index("getDatasetItemSubsetByName") >= 0)

#----------------------------------------------------------------------------------------------------
def testListDataItemsAvailable():

  payload = {"dataset": "DEMOdz"}
  msg = dumps({"cmd": "getDatasetItemNames", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  demodz_itemNames = result["payload"]
  assert(len(demodz_itemNames) > 3)
     # ensure that the copy number matrix is among them
  assert(demodz_itemNames.index("mtx.cn") >= 0)
  assert(demodz_itemNames.index("sampleJSON") >= 0)
  print("demodz_itemNames")
  print(demodz_itemNames)

  payload = {"dataset": "TCGAbrain"}
  msg = dumps({"cmd": "getDatasetItemNames", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  brain_itemNames = result["payload"]
  assert(len(brain_itemNames) > 3)
     # ensure that the copy number matrix is among them
  assert(brain_itemNames.index("mtx.cn") >= 0)
     # but that sampleJSON, unique to DEMOdz, is not
  assert(("sampleJSON" in brain_itemNames) == False)
  print("brain_itemNames")
  print(brain_itemNames)

#----------------------------------------------------------------------------------------------------
def testRequestCopyNumberMatrix():

  payload = {"dataset": "DEMOdz", "items": "mtx.cn"}
  msg = dumps({"cmd": "getDatasetItemsByName", "status":"request", "callback":"", "payload": payload})
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

    # expect this result (R version)
    #                  PTEN EGFR
    #  TCGA.TM.A7C3.01   -1    2
    #  TCGA.S9.A7R1.01    0    0
    #  TCGA.S9.A7R2.01   -1    1
    #  TCGA.S9.A6TS.01   -1   -1
    

  tumors = ['TCGA.TM.A7C3.01', 'TCGA.S9.A7R1.01',  'TCGA.S9.A7R2.01', 'TCGA.S9.A6TS.01']
  genes  = ['PTEN', 'EGFR']

  payload = {"dataset": "TCGAbrain", "items": "mtx.cn",
             "entities": tumors,
             "features": genes
             }

  msg = dumps({"cmd": "getDatasetItemSubsetByName", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]

  mtx = payload['mtx']
  rownames = payload['rownames']
  colnames = payload['colnames']
  assert(mtx == [[-1, 2], [0, 0], [-1, 1], [-1, -1]])
  assert(rownames == tumors)
  assert(colnames == genes)


#----------------------------------------------------------------------------------------------------
def testRequestCopyNumberMutationMatricesSampleJSON():

  itemsRequested = ["mtx.cn", "mtx.mut", "sampleJSON"]
  payload = {"dataset": "DEMOdz", "items": itemsRequested}
  
  msg = dumps({"cmd": "getDatasetItemsByName", "status":"request", "callback":"", "payload": payload})
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

#----------------------------------------------------------------------------------------------------
testManifest()
testAvailableMessages()
testListDataItemsAvailable()
testRequestCopyNumberMatrix()
#testRequestCopyNumberMutationMatricesSampleJSON()

print(True)
