import sys
from websocket import create_connection
from json import *

if(len(sys.argv)< 3):
	print "test requires server and port value: python testPCAWebSocketOperations.py <server> <port>"
	sys.exit(2)

server = sys.argv[1]
port = sys.argv[2]
ws = create_connection("ws://"+server+":"+port)
#------------------------------------------------------------------------------------------------------------------------
def runTests():

  testEcho()
  testCreateWithDataSet()
  testCalculate()
  testCalculateOnGeneSubset()
  testCalculateOnSampleSubset()
  testCalculateOnGeneAndSampleSubsets()

#------------------------------------------------------------------------------------------------------------------------
def runServerTests():

  testCreateWithDataSet()
#  testCalculate()
#  testCalculateOnGeneSubset()
#  testCalculateOnSampleSubset()
#  testCalculateOnGeneAndSampleSubsets()

#------------------------------------------------------------------------------------------------------------------------
def testEcho():

  "sends the echo command with payload, expects 'payload-payload' in return"

  print "--- testEcho"

  payload = "from testPCAWebSocketOperations.py"
  msg = dumps({"cmd": "echo", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"][0] == 'echo from PCA/inst/unitTests/runPCATestWebSocketServer.R: ' + payload)

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
  payload = result["payload"][0];
  assert(payload.find("PCA package, matrices:") >= 0)

#------------------------------------------------------------------------------------------------------------------------
def testCalculate():
  "calculates pca on DEMOdz, the full mrna matrix, using pca object created above"

  print "--- testCalculate"
  payload = {"expressionDataSet":"mtx.mrna.ueArray"}
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"][0] == "handlePcaResult")
  assert(result["status"][0] == "success")

  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'loadings', 'maxValue'])

  ids = payload["ids"]
  assert(len(ids) == 64)
  assert(ids[1:5] == ['EED', 'EEF2', 'EFEMP2', 'EGFR'])

  assert(payload["maxValue"][0] == 0.2665)

  assert(payload["importance.PC1"][0] == 0.3218)
  assert(payload["importance.PC2"][0] == 0.1625)

#----------------------------------------------------------------------------------------------------
def testCalculateOnGeneSubset():

  "calculates pca on DEMOdz, a mrna matrix subsetted by a list of genes, using pca object created above"

  print "--- testCalculateOnGeneSubset"

  goi =  ["EDIL3", "EED", "EEF2", "EFEMP2", "EGFR", "EHD2", "EIF4A2", "ELAVL1", "ELAVL2", "ELF4"];
  payload = {"genes": goi, "expressionDataSet":"mtx.mrna.ueArray"}
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  
  result = loads(ws.recv())
  assert(result["cmd"][0] == "handlePcaResult")
  assert(result["status"][0] == "success")
  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'loadings', 'maxValue'])
  
  ids = payload["ids"]
  assert(len(ids) == len(goi))
  assert(ids == goi)
  
  assert(payload["maxValue"][0] == 0.5088)
  assert(payload["importance.PC1"][0] == 0.3296)
  assert(payload["importance.PC2"][0] == 0.2460)

#----------------------------------------------------------------------------------------------------
def testCalculateOnSampleSubset():

  "calculates pca on DEMOdz, a mrna matrix subsetted by a list of genes, using pca object created above"

  print "--- testCalculateOnSampleSubset"

  soi = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0033", "TCGA.02.0037"]
  payload = {"samples": soi, "expressionDataSet":"mtx.mrna.ueArray"}
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  
  result = loads(ws.recv())
  assert(result["cmd"][0] == "handlePcaResult")
  assert(result["status"][0] == "success")
  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'loadings', 'maxValue'])
  
  ids = payload["ids"]
  assert(len(ids) == 64)
  
  assert(payload["maxValue"][0] == 0.2530)
  assert(payload["importance.PC1"][0] == 0.5064)
  assert(payload["importance.PC2"][0] == 0.2279)

#----------------------------------------------------------------------------------------------------
def testCalculateOnGeneAndSampleSubsets():

  "calculates pca on DEMOdz, a mrna matrix subsetted by a list of genes, using pca object created above"

  print "--- testCalculateOnGeneAndSampleSubsets"

  goi = ["EDIL3", "EED", "EEF2", "EFEMP2", "EGFR", "EHD2", "EIF4A2", "ELAVL1", "ELAVL2", "ELF4"]
  soi = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0033", "TCGA.02.0037"]
  payload = {"genes": goi, "samples": soi, "expressionDataSet":"mtx.mrna.ueArray"}
  
  msg = dumps({"cmd": "calculatePCA", "status":"request", 
              "callback":"handlePcaResult", "payload": payload})
  ws.send(msg)
  
  result = loads(ws.recv())
  assert(result["cmd"][0] == "handlePcaResult")
  assert(result["status"][0] == "success")
  payload = result["payload"]
  keys = payload.keys()
  keys.sort()
  assert(keys == ['ids', 'importance.PC1', 'importance.PC2', 'loadings', 'maxValue'])
  
  ids = payload["ids"]
  assert(ids == goi)

  assert(payload["maxValue"][0] == 0.5445)
  assert(payload["importance.PC1"][0] == 0.5075)
  assert(payload["importance.PC2"][0] == 0.2802)

#----------------------------------------------------------------------------------------------------
interactive = (sys.argv[0] != "testPCAWebSocketOperations.py")
liveTesting = (sys.argv[1] == "lopez.fhcrc.org")
if(not(interactive)):
  if(liveTesting):
    runServerTests()	
  else:
	runTests()

