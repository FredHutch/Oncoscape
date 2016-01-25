import sys
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:9003")
#------------------------------------------------------------------------------------------------------------------------
def runTests():

  testEcho()
  testCreateWithDataSet()
  testSummarizePLSRPatientAttributes()
  testCalculateSmallOneFactor()
  testCalculateSmallTwoFactors()

#------------------------------------------------------------------------------------------------------------------------
def testEcho():

  "sends the echo command with payload, expects 'payload-payload' in return"

  print ("--- testEcho")

  msg = dumps({"cmd": "echo", "status":"request", "callback":"", "payload": "python"})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"][0] == "python-python")

#------------------------------------------------------------------------------------------------------------------------
def testCreateWithDataSet():

  "sends dataset as a named string, gets back show method's version of the dataset object"

  print ("--- testCreateWithDataSet")

  msg = dumps({"cmd": "createPLSR", "status":"request", 
               "callback":"PLSRcreatedHandler", "payload": "DEMOdz"})
  ws.send(msg)
  result = loads(ws.recv())
  print result["payload"][0]
  assert(result["payload"][0] == "PLSR package, matrices: mtx.mrna,mtx.mut,mtx.cn,mtx.prot,mtx.meth")

#------------------------------------------------------------------------------------------------------------------------
def testSummarizePLSRPatientAttributes():

  "gets five-number summary of any numerical attribute in the patient history table"

  print ("--- testSummarizePLSRPatientAttributes")
  payload = ["AgeDx"]
    
  msg = dumps({"cmd": "summarizePLSRPatientAttributes", "status":"request", 
               "callback":"handlePlsrClincialAttributeSummary", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["status"][0] == "to be examined element by element")
  assert(result["cmd"][0] == "handlePlsrClincialAttributeSummary")
  assert(result["payload"]["AgeDx"] ==  [9369, 15163.5, 19153, 25736, 31566])
  
     # send a second reqauest, but one guaranteed to fail
  payload = "bogus"
  msg = dumps({"cmd": "summarizePLSRPatientAttributes", "status":"request", 
               "callback":"handlePlsrClincialAttributeSummary", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"]["bogus"][0] == None)

#----------------------------------------------------------------------------------------------------
def testCalculateSmallOneFactor():
  "calculates plsr on DEMOdz, with two patient groups, low and high AgeDx (age at diagnosis)"

  print ("--- testCalculateSmallOneFactor")

    # in R: sample(colnames(matrices(getDataPackage(myplsr))$mtx.mrna), size=10)
  genesOfInterest = ["ELL","EIF4A2","ELAVL2","UPF1","EGFR","PRPSAP2","TTPA","PIGP","TTN","UNC45A"]
    
  factor = {"name": "AgeDx", "low": 12000, "high": 2800}
  
  payload = {"genes": genesOfInterest, "expressionDataSet": "mtx.mrna.ueArray", "factorCount": 1, "factors": [factor]};
  
  msg = dumps({"cmd": "calculatePLSR", "status":"request", 
               "callback":"handlePlsrResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"][0] == "handlePlsrResult")
  assert(result["status"][0] == "response")
  payload = result["payload"]
  fieldNames = payload.keys()
  fieldNames.sort()
  assert(fieldNames == ['loadingNames', 'loadings', 'maxValue', 'vectorNames', 'vectors'])
  vectors = payload["vectors"]
  assert(len(vectors) == 2)
  vectorNames = payload["vectorNames"]
  assert(vectorNames == ['AgeDx.lo', 'AgeDx.hi'])
  loadings = payload["loadings"]
  loadingNames = payload["loadingNames"]
  assert(loadingNames == genesOfInterest)
  assert(len(loadings) == 10)
  maxValue = payload["maxValue"][0]
  assert(maxValue == 0.8195)

#----------------------------------------------------------------------------------------------------
def testCalculateSmallTwoFactors():
  "calculates plsr on DEMOdz, with two patient groups, low and high AgeDx (age at diagnosis)"

  print ("--- testCalculateSmallTwoFactors")

    # in R: sample(colnames(matrices(getDataPackage(myplsr))$mtx.mrna), size=10)
  genesOfInterest = ["ELL","EIF4A2","ELAVL2","UPF1","EGFR","PRPSAP2","TTPA","PIGP","TTN","UNC45A"]
    
  factor1 = {"name": "AgeDx", "low": 12000, "high": 2800}
  factor2 = {"name": "Survival", "low": 20, "high": 3000}
  
  payload = {"genes": genesOfInterest, "expressionDataSet": "mtx.mrna.ueArray", "factorCount": 2, "factors": [factor1, factor2]};
  
  msg = dumps({"cmd": "calculatePLSR", "status":"request", 
               "callback":"handlePlsrResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"][0] == "handlePlsrResult")
  assert(result["status"][0] == "response")
  payload = result["payload"]
  fieldNames = payload.keys()
  fieldNames.sort()
  assert(fieldNames == ['loadingNames', 'loadings', 'maxValue', 'vectorNames', 'vectors'])
  vectors = payload["vectors"]
  vectorNames = payload["vectorNames"]
  assert(vectorNames == ['AgeDx.lo', 'AgeDx.hi', 'Survival.lo', 'Survival.hi'])
  loadings = payload["loadings"]
  loadingNames = payload["loadingNames"]
  assert(loadingNames == genesOfInterest)
  assert(len(vectors) == 4)
  assert(len(loadings) == 10)
  maxValue = payload["maxValue"][0]
  assert(maxValue == 0.8822)

#------------------------------------------------------------------------------------------------------------------------
interactive = (sys.argv[0] != "testWrapper.py")
if(not(interactive)):
  runTests()

