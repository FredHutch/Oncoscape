# start up oncoscape in the parent directory, like usual, then
# run this python script to ensure that all of the oncoscape requests
# needed by the datasets module work, and can be repeated at
# high volume without difficulty
#----------------------------------------------------------------------------------------------------
import sys
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:7578")
#----------------------------------------------------------------------------------------------------
def runTests():

  testPing()
  testGetDataSetNames();
  testGetManifest();
  testHistogramCoordinatesIntentionalError()
  testHistogramCoordinatesDEMOdz_mrna()

#------------------------------------------------------------------------------------------------------------------------
def testPing():
  "sends the 'ping' command, payload ignored, expects the current date in return"

  print "--- testPing"

  payload = "datasets/wsJsonTests/test.py"
  msg = dumps({"cmd": "ping", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload2 = result["payload"]
  assert(payload2.find(payload) >= 0)
  assert(len(payload2) > len(payload))

#------------------------------------------------------------------------------------------------------------------------
def testGetDataSetNames():

  "get a list of the names"

  print "--- testGetDataSetNames"

  payload = "";
  msg = dumps({"cmd": "getDataSetNames", "status": "request", "callback": "", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())

    # in test mode, which is enforced by runDevel.R assignments in the parent directory
    #   userID <- "test@nowhere.org"
    #   current.datasets <- c("DEMOdz")
    # we expect only DEMOdz

  assert(result["payload"] =="DEMOdz")

#------------------------------------------------------------------------------------------------------------------------
def testGetManifest():

  "get the full data.frame for DEMOdz"

  print "--- testGetManifest"

  payload = "DEMOdz";
  msg = dumps({"cmd": "getDataManifest", "status": "request", "callback": "", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = loads(result["payload"])

  # in test mode, which is enforced by runDevel.R assignments in the parent directory
  #   userID <- "test@nowhere.org"
  #   current.datasets <- c("DEMOdz")
  # we expect only DEMOdz

  colnames = payload["colnames"]
  assert(len(colnames) == 9)
  assert(colnames[0:3] == ["category", "subcategory", "rows"])
  mtx = payload["mtx"]
  assert(len(mtx) == 4)
  assert(len(mtx[1]) == 9)

#------------------------------------------------------------------------------------------------------------------------
def testHistogramCoordinatesIntentionalError():

  "demonstrate error tryCatch, returning explanatory standard json message"

  print "--- testHistogramCoordinatesIntentionalError"

  dataset = "DEMOdz";
  dataItem = "mtx.mRNA";
  cmd = "calculateHistogramCoordinates"
  callback = "handleHistogramCoordinates"

    # elicit a representative error, make sure it is trapped and returned as a bona fide json message
    # with enough error detail for us to figure out

  payload = "intentional error"

  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})


  ws.send(msg)
  result = loads(ws.recv())

   # we expect this reply
   # {cmd: 'handleHistogramCoordinates'
   #  status: 'error',
   #  callback: '', 
   #  payload: 'OncoDev13 (version 1.3.8) exception!  
   #            Error in payload$dataset: $ operator is invalid for atomic vectors\n. 
   #            incoming msg: request;  handleHistogramCoordinates;  calculateHistogramCoordinates;  intentional error'}

  assert(result["status"] == "error")
  assert(result["payload"].find("exception!") >= 0)
  assert(result["payload"].find("(version") >= 0)
  assert(result["payload"].find(callback) >= 0)
  assert(result["payload"].find(payload) >= 0)

# testHistogramCoordinatesIntentionalError
#------------------------------------------------------------------------------------------------------------------------
def testHistogramCoordinatesDEMOdz_mrna():

  "demonstrate error tryCatch, returning explanatory standard json message"

  print "--- testHistogramCoordinatesDEMOdz_mrna"

  dataset = "DEMOdz";
  dataItem = "mtx.mrna";
  cmd = "calculateHistogramCoordinates"
  callback = "handleHistogramCoordinates"

  payload = {"dataset": dataset, "dataItem": dataItem}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = loads(result["payload"])

  breaks = payload["breaks"]
  counts = payload["counts"]
  mids = payload["mids"]

  assert(breaks == [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6])
  assert(counts == [1, 2, 25, 196, 421, 409, 181, 38, 5, 1, 1])
  assert(mids   == [-4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5])

# testHistogramCoordinatesDEMOdz_mrna
#------------------------------------------------------------------------------------------------------------------------
interactive = (sys.argv[0] != "test.py")
if(not(interactive)):
  runTests()

