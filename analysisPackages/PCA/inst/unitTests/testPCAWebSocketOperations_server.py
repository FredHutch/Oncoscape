import sys
from websocket import create_connection
from json import *

if(len(sys.argv)< 2):
	print "test requires sitename: python testPCAWebSocketOperations.py <url>"
	sys.exit(2)

site = sys.argv[1]
ws = create_connection("ws://"+site)
#------------------------------------------------------------------------------------------------------------------------
def runTests():

  testCreateWithDataSet()
  testCalculate()
  testCalculateOnGeneSubset()
  testCalculateOnSampleSubset()
  testCalculateOnGeneAndSampleSubsets()

#------------------------------------------------------------------------------------------------------------------------
def testCreateWithDataSet():

  "sends dataset as a named string, gets back show method's version of the dataset object"

  print "--- testCreateWithDataSet"

    # two mRNA expression matrices in DEMOdz: 
    #   "mtx.mrna.ueArray" "mtx.mrna.bc"

  payload = {"dataPackage": "DEMOdz", "matrixName": "mtx.mrna.ueArray"}
  
  msg = dumps({"cmd": "createPCA", "status":"request", 
               "callback":"PCAcreatedHandler", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"];  #server returns string values instead of arrays
  assert(payload.find("PCA package, matrices:") >= 0)

#------------------------------------------------------------------------------------------------------------------------
def testCalculate():
  "calculates pca on DEMOdz, the full mrna matrix, using pca object created above"

  print "--- testCalculate"

  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": ""})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePcaResult")
  assert(result["status"] == "success")

  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'maxValue', 'scores'])

  ids = payload["ids"]
  assert(len(ids) == 20)
  assert(ids[0:5] == ['TCGA.02.0014', 'TCGA.02.0021','TCGA.02.0028', 'TCGA.02.0033','TCGA.02.0037'])

  assert(payload["maxValue"] == 8.447)

  assert(payload["importance.PC1"] == 0.3218)
  assert(payload["importance.PC2"] == 0.1625)

#----------------------------------------------------------------------------------------------------
def testCalculateOnGeneSubset():

  "calculates pca on DEMOdz, a mrna matrix subsetted by a list of genes, using pca object created above"

  print "--- testCalculateOnGeneSubset"

  goi =  ["EDIL3", "EED", "EEF2", "EFEMP2", "EGFR", "EHD2", "EIF4A2", "ELAVL1", "ELAVL2", "ELF4"];
  payload = {"genes": goi}
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePcaResult")
  assert(result["status"] == "success")
  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'maxValue', 'scores'])
  
#  ids = payload["ids"]
#  assert(len(ids) == len(goi))
#  assert(ids == goi)

  assert(payload["maxValue"] == 3.577)
  assert(payload["importance.PC1"] == 0.3296)
  assert(payload["importance.PC2"] == 0.2460)

#----------------------------------------------------------------------------------------------------
def testCalculateOnSampleSubset():

  "calculates pca on DEMOdz, a mrna matrix subsetted by a list of genes, using pca object created above"

  print "--- testCalculateOnSampleSubset"

  soi = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0033", "TCGA.02.0037"]
  payload = {"samples": soi}
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePcaResult")
  assert(result["status"] == "success")
  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'maxValue', 'scores'])
  
  ids = payload["ids"]
  assert(len(ids) == 5)
  
  assert(payload["maxValue"] == 7.3397)
  assert(payload["importance.PC1"] == 0.5064)
  assert(payload["importance.PC2"] == 0.2279)

#----------------------------------------------------------------------------------------------------
def testCalculateOnGeneAndSampleSubsets():

  "calculates pca on DEMOdz, a mrna matrix subsetted by a list of genes, using pca object created above"

  print "--- testCalculateOnGeneAndSampleSubsets"

  goi = ["EDIL3", "EED", "EEF2", "EFEMP2", "EGFR", "EHD2", "EIF4A2", "ELAVL1", "ELAVL2", "ELF4"]
  soi = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0033", "TCGA.02.0037"]
  payload = {"genes": goi, "samples": soi}
  
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePcaResult")
  assert(result["status"] == "success")
  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'maxValue', 'scores'])
  
  ids = payload["ids"]
  assert(ids == soi)
  
  assert(payload["maxValue"] == 2.9733)
  assert(payload["importance.PC1"] == 0.5075)
  assert(payload["importance.PC2"] == 0.2802)

#----------------------------------------------------------------------------------------------------
interactive = (sys.argv[0] != "testPCAWebSocketOperations_server.py")
if(not(interactive)):
	runTests()

