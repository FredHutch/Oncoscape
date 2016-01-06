# testWebSocketOperations.py
#----------------------------------------------------------------------------------------------------
import sys
import time
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:6001")
#----------------------------------------------------------------------------------------------------
def runTests():

  test_ping()
  test_serverVersion();
  test_getDataFrame();
  test_getUserID();
  test_getDataSetNames();
  test_getGeneSets();
  test_getCopyNumberMatrix();
  test_getSampleCategorizations();
  test_getManifest();
  test_specifyCurrentDataset()
  test_getPatientHistoryTable()
  test_survivalCurves()

  #userDataStoreTests()   # need environment variable, lost within emacs/ess

  test_getPatientHistoryDxAndSurvivalMinMax()

     # TODO: recent changes to DEMOdz include expression matrices far too large, breaking these
     # TODO: data-specific tests.  fix this!  (pshannon 14aug2015)

  test_getMarkersNetwork()
  test_getPathway();

  #test_pca()  # contains 3 more granular tests
  test_plsr()  # contains 3 more granular tests

  test_eventLogging()

  print "OK:  all python websocket json tests passed"

#----------------------------------------------------------------------------------------------------
def userDataStoreTests():

     # these are all defined in pkg/R/wsUserDataStore.R
     # environment variable ONCOSCAPE_USER_DATA_STORE must point to, eg,
     # export ONCOSCAPE_USER_DATA_STORE=file:///Users/pshannon/oncoUserData

  test_initUserDataStore()
  test_getUserDataStoreSummary()
  test_addDataToUserDataStore_1_item()
  test_getDataItem()
  test_deleteDataStoreItem()


#----------------------------------------------------------------------------------------------------
def test_ping():

  "sends the 'ping' command, payload ignored, expects the current date in return"

  print "--- test_ping"

  payload = "datasets/wsJsonTests/test.py"
  msg = dumps({"cmd": "ping", "status":"request", "callback":"", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload2 = result["payload"]
  assert(payload2.find(payload) >= 0)
  assert(len(payload2) > len(payload))

#------------------------------------------------------------------------------------------------------------------------
def test_serverVersion():

  "sends the 'serverVersion' command, payload ignored, expects current x.y.z R package version in return"

  print "--- test_serverVersion"

  msg = dumps({"cmd": "getServerVersion", "status":"request", "callback":"", "payload": ""})
  ws.send(msg)
  result = loads(ws.recv())
  version = result["payload"]
  assert version.index("1.4") == 0

#------------------------------------------------------------------------------------------------------------------------
def test_getDataFrame():

  "sends the 'getDataFrame' command, payload ignored, expects a small mixed-type json-encoding in return"

  print "--- test_getDataFrame"

  msg = dumps({"cmd": "getSampleDataFrame", "status":"request", "callback":"", "payload": ""})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]

    # the dataframe has been transformed in R to a matrix of type character
    # columnames are shipped separately in the payload
    # the contents of the matrix come as a list of lists, one row per list

  assert payload.keys() == ["colnames", "tbl"]
  columnNames = payload["colnames"]
  assert columnNames == ['integers', 'strings', 'floats']
  tbl = payload["tbl"]
  assert tbl == [['1', 'ABC', '3.140'], ['2', 'def', '2.718']]

#------------------------------------------------------------------------------------------------------------------------
def test_getUserID():

  "get the current value"

  print "--- test_getUserId"
  payload = "";
  msg = dumps({"cmd": "getUserId", "status": "request", "callback": "", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())

    # in test mode, which is enforced by runWsTestOnco.R assignments in the current directory
    #   userID <- "test@nowhere.net"
    #   current.datasets <- c("DEMOdz;TCGAgbm")

  assert(result["payload"] == "test@nowhere.net");


#------------------------------------------------------------------------------------------------------------------------
def test_getDataSetNames():

  "get a list of the names"

  print "--- test_getDataSetNames"

  payload = "";
  msg = dumps({"cmd": "getDataSetNames", "status": "request", "callback": "", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())

    # in test mode, which is enforced by runDevel.R assignments in the parent directory
    #   userID <- "test@nowhere.net"
    #   current.datasets <- c("DEMOdz;TCGAgbm")
    # we expect only DEMOdz

  payload = result["payload"]
  assert(result["payload"]["datasets"] == ["DEMOdz","TCGAgbm"])
  assert(result["payload"]["passwordProtected"] == False)

#------------------------------------------------------------------------------------------------------------------------
def test_getManifest():

  "get the full data.frame for DEMOdz"

  print "--- test_getManifest"
  
  payload = "DEMOdz";
  msg = dumps({"cmd": "getDataManifest", "status": "request", "callback": "", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]
  fieldNames = payload.keys()
  fieldNames.sort()
  assert fieldNames == ["colnames", "datasetName", "mtx", "rownames"]
  
  # in test mode, which is enforced by runDevel.R assignments in the parent directory
  #   userID <- "test@nowhere.net"
  #   current.datasets <- c("DEMOdz")
  # we expect only DEMOdz
  
  colnames = payload["colnames"]
  assert(len(colnames) == 9)
  assert(colnames[0:3] == ["category", "subcategory", "rows"])
  
    # the matrix (it's all strings right now) comes across the wire as
    # as a list of lists, which in javascript will appears as an array of arrays
  
  mtx = payload["mtx"]
  assert type(mtx) is list
  assert type(mtx[0]) is list
  assert len(mtx) >= 9
  assert len(mtx[0]) == 9
      # each row is actually a row
  #assert mtx[0][0:4] == [u'mRNA expression', u'Z scores', u' 20', u' 64']

#------------------------------------------------------------------------------------------------------------------------
def test_histogramCoordinatesIntentionalError():

  "demonstrate error tryCatch, returning explanatory standard json message"

  print "--- test_histogramCoordinatesIntentionalError"

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
def test_histogramCoordinatesDEMOdz_mrna():

  "demonstrate error tryCatch, returning explanatory standard json message"

  print "--- test_histogramCoordinatesDEMOdz_mrna"

  dataset = "DEMOdz";
  dataItem = "mtx.mrna";
  cmd = "calculateHistogramCoordinates"
  callback = "handleHistogramCoordinates"

  payload = {"dataset": dataset, "dataItem": dataItem}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]

  breaks = payload["breaks"]
  counts = payload["counts"]
  mids = payload["mids"]

  assert(breaks == [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6])
  assert(counts == [1, 2, 25, 196, 421, 409, 181, 38, 5, 1, 1])
  assert(mids   == [-4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5, 5.5])

# testHistogramCoordinatesDEMOdz_mrna
#------------------------------------------------------------------------------------------------------------------------
def test_specifyCurrentDataset_GBM():

  "set current dataset, with legal value, with a nonsensical one"

  print "--- test_specifyCurrentDataset"

  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "TCGAgbm";
  payload = dataset
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert(result["payload"]["datasetName"] == dataset);
  assert(result["cmd"] == callback)
  
     # now one which should fail
  dataset = "hocus-pocus";
  payload = dataset
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["status"] == "error"
  assert result["payload"].find("exception!") >= 0
  assert result["payload"].find("not TRUE") >= 0
  
#------------------------------------------------------------------------------------------------------------------------
def test_specifyCurrentDataset():

  "set current dataset, with legal value, with a nonsensical one"

  print "--- test_specifyCurrentDataset"

  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  payload = result["payload"]
  fields =  payload.keys()
  assert fields == ["datasetName", "mtx", "rownames", "colnames"];
  assert payload["datasetName"] == "DEMOdz"
  mtx = payload["mtx"]
  colnames = payload["colnames"]
  rownames = payload["rownames"]
  datasetName = payload["datasetName"]
  assert datasetName == "DEMOdz"
  assert colnames == ['category', 'subcategory', 'rows', 'cols', 'row type', 'column type', 'minValue', 'maxValue', 'provenance']
  
     # we might get more rows in the manifest matrix than the 9 we now have, but the column count should be pretty constant
  assert len(mtx[0]) == 9
     # check just one row's name
  assert(rownames.index("mtx.mut.RData") >= 0)


#------------------------------------------------------------------------------------------------------------------------
def test_getPatientHistoryTable():

  "set current dataset, ask for patient history"

  print "--- test_getPatientHistoryTable"
  
   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------
  
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
     #------------------------------------------------------------------------------------------
     # ask for the history table.  duration formats (Survival, AgeDx, TimeFirstProgression) 
     # default to the native storage type, "byDay"
     #------------------------------------------------------------------------------------------
  
  cmd = "getPatientHistoryTable"
  callback = "displayPatientHistory"
  
  payload = ""   # equivalent to {"durationFormat": "byDay"} - the default
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
    
  fields = result.keys()
  fields.sort()
  assert fields == ["callback", "cmd", "payload", "status"]
  assert result["status"] == "success"
  assert result["callback"] == ""
  assert result["cmd"], "displayPatientHistory"
  
  payload = result["payload"]
  assert payload.keys() == ["colnames", "tbl"]
  columnNames = payload["colnames"]
    
       # current column names will likely change.  but for now:
    
  assert columnNames == ['ptID', 'study', 'Birth.gender', 'Survival', 'AgeDx', 
                       'TimeFirstProgression', 'Status.status']
  tbl = payload["tbl"]
    
  assert len(tbl) == 20            # 20 rows in the DEMOdz patient history table
  assert len(tbl[0]) == 7          # 7 columns extracted from possibly many more
                                   # this will become a dataPackage-specific list
                                   # todo: find out where the whitespace comes from,
                                   # todo: e.g. ' 9369'
  
  assert(tbl[0][3].strip() == "2512")
  assert(tbl[0][4].strip() == "9369")
  assert(tbl[0][5].strip() == "2243")
  
     #------------------------------------------------------------------------------------------
     # ask for the history table, now with duration format "byYear"
     #------------------------------------------------------------------------------------------
  
  cmd = "getPatientHistoryTable"
  callback = "displayPatientHistory"
  
  payload = {"durationFormat": "byYear"}
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
    
  fields = result.keys()
  fields.sort()
  assert fields == ["callback", "cmd", "payload", "status"]
  assert result["status"] == "success"
  assert result["callback"] == ""
  assert result["cmd"], "displayPatientHistory"
  
  payload = result["payload"]
  assert payload.keys() == ["colnames", "tbl"]
  columnNames = payload["colnames"]
    
       # current column names will likely change.  but for now:
    
  assert columnNames == ['ptID', 'study', 'Birth.gender', 'Survival', 'AgeDx', 
                         'TimeFirstProgression', 'Status.status']
  tbl = payload["tbl"]
    
  assert len(tbl) == 20            # 20 rows in the DEMOdz patient history table
  assert len(tbl[0]) == 7          # 7 columns extracted from possibly many more
                                     # this will become a dataPackage-specific list
  assert(tbl[0][3] == "6.877")
  assert(tbl[0][4] == "25.651")
  assert(tbl[0][5] == "6.141")
  

#----------------------------------------------------------------------------------------------------
def test_getPatientHistoryDxAndSurvivalMinMax():
  
  print "--- test_getPatientHistoryDxAndSurvivalMinMax"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------

  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "TCGAgbm";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
   #------------------------------------------------------------
   # now ask for ageAtDx and survival mins and maxes
   #------------------------------------------------------------

  cmd = "getPatientHistoryDxAndSurvivalMinMax"
  callback =  "handleAgeAtDxAndSurvivalRanges"
  status = "request"
  payload = ""
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["cmd"] == callback
  assert result["status"] == "success"
  assert(result["payload"].keys() == ['ageAtDxLow', 'ageAtDxHigh', 'survivalHigh', 'survivalLow'])
  assert(result["payload"]["ageAtDxLow"] == 3982)
  assert(result["payload"]["ageAtDxHigh"] == 32612)
  assert(result["payload"]["survivalLow"] == 3)
  assert(result["payload"]["survivalHigh"] == 3881)
  
#----------------------------------------------------------------------------------------------------
# we typically find "history.RData", a list of lists, in a data package.  but this caisis-derived
# data is not always available.  the alternative is a tsv file (data.frame) hand-crafted from
# relevant patient or sample hsitory. client code will supply the name, and this
def test_getPrebuiltPatientHistoryTable():

  "set current dataset, ask for prebuilt patient history"

  print "--- test_getPrebuiltPatientHistoryTable"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------

  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
     #------------------------------------------------------------
     # now ask for the history table
     #------------------------------------------------------------
  
  cmd = "getPatientHistoryTable"
  callback = "displayPatientHistory"
  
  payload = ""
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  fields = result.keys()
  fields.sort()
  assert fields == ["callback", "cmd", "payload", "status"]
  assert result["status"] == "success"
  assert result["callback"] == ""
  assert result["cmd"], "displayPatientHistory"
  
  payload = result["payload"]
  assert payload.keys() == ["colnames", "tbl"]
  columnNames = payload["colnames"]
  
     # current column names will likely change.  but for now:
  
  assert columnNames == ['ptID', 'study', 'Birth.gender', 'Survival', 'AgeDx', 
                         'TimeFirstProgression', 'Status.status']
  tbl = payload["tbl"]
  
  assert len(tbl) == 20            # 20 rows in the DEMOdz patient history table
  assert len(tbl[0]) == 7          # will evolve to be configurable for each data package

  assert(tbl[0][3] == "2512")
  assert(tbl[0][4] == "25.651")
  assert(tbl[0][5] == "6.141")


#----------------------------------------------------------------------------------------------------
def test_getGeneSets():

  "set current dataset, ask for geneset names, then the genes in one set"

  print "--- test_getGeneSets"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"

   #------------------------------------------------------------
   # now ask for the geneset names
   #------------------------------------------------------------

  cmd = "getGeneSetNames"
  callback = "handleGeneSetNames"
  
  payload = ""
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  fields = result.keys()
  fields.sort()
  assert fields == ["callback", "cmd", "payload", "status"]
  assert result["status"] == "success"
  assert result["callback"] == ""
  assert result["cmd"], callback
  
  payload = result["payload"]
  payload.sort()
  assert payload == ["random.24", "random.40", "test4"]
  
  cmd = "getGeneSetGenes"
  payload = "random.24"
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  genes = result["payload"]
  genes.sort()
  assert len(genes) == 24
  assert genes[0:5] == ['EFEMP2', 'ELAVL1', 'ELAVL2', 'ELL', 'ELN']


#----------------------------------------------------------------------------------------------------
def test_getCopyNumberMatrix():
  "set current dataset, ask for geneset names, then the genes in one set"

  print "--- test_getCopyNumberMatrix"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"

   #------------------------------------------------------------
   # now ask for the g
   #------------------------------------------------------------

  cmd = "getGeneSetNames"
  callback = "handleGeneSetNames"
  


#----------------------------------------------------------------------------------------------------
def test_getSampleCategorizations():

  "set current dataset, ask for the names of the categorizations, then the actual datat"

  print "--- test_getSampleCategorizations"

  payload = "";
  msg = dumps({"cmd": "getDataSetNames", "status": "request", "callback": "", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"]["datasets"].index("DEMOdz") >= 0)
  
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
    
       # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
    
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
     #------------------------------------------------------------
     # now ask for the sample categorization names
     #------------------------------------------------------------
  
  cmd = "getSampleCategorizationNames"
  callback = "handleSampleCategorizationNames"
    
  payload = ""
    
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"].index("tbl.glioma8") >= 0)
  assert(result["payload"].index("tbl.verhaakPlus1") >= 0)
  
     #------------------------------------------------------------
     # now ask for the sample categorization data
     #------------------------------------------------------------
  
  cmd = "getSampleCategorization"
  payload = "tbl.verhaakPlus1"
    
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  colnames = result["payload"]["colnames"]
  rownames = result["payload"]["rownames"]
  tbl = result["payload"]["tbl"]
  
  assert(colnames == [u'cluster', u'color'])
  assert(len(rownames) == 548)
  assert(len(tbl) == 548)
  assert(len(tbl[0]) == 2)
  
  payload = "tbl.glioma8"
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  colnames = result["payload"]["colnames"]
  rownames = result["payload"]["rownames"]
  tbl = result["payload"]["tbl"]
  
  assert(colnames == [u'cluster', u'color'])
  assert(len(rownames) == 704)
  assert(len(tbl) == 704)
  assert(len(tbl[0]) == 2)

#----------------------------------------------------------------------------------------------------
def test_getMarkersNetwork():

  "set current dataset, ask for markers network"

  print "--- test_getMarkersNetwork"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
   #------------------------------------------------------------
   # now ask for the geneset names
   #------------------------------------------------------------
  
  cmd = "getMarkersNetwork"
  callback = "displayMarkersNetwork"
  payload = ""
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["cmd"] == callback
  assert result["status"] == "success"
  assert len(result["payload"]) > 50000  # 67263 on (14 aug 2015)
  
#----------------------------------------------------------------------------------------------------
def test_getPathway():

  "set current dataset, ask for pi3kAkt pathway"

  print "--- test_getPathway"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
   #------------------------------------------------------------
   # now ask for the geneset names
   #------------------------------------------------------------
  
  cmd = "getPathway"
  callback = "displayMarkersNetwork"
  payload = "g.pi3kAkt.json"
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["cmd"] == callback
  assert result["status"] == "success"
  assert len(result["payload"]) > 150000  # 1670299 on (14 aug 2015)
  
#----------------------------------------------------------------------------------------------------
def test_initUserDataStore():

  "connect to (and possibly create) a user data store"

  print "--- test_initUserDataStore"

  cmd = "initUserDataStore"
  callback = "userDataStoreInitialized"
  payload = {"userID": "test@nowhere.net", "userGroups": ["public", "test"]};
  
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())

  fields = result.keys()
  fields.sort()
  assert fields == ["callback", "cmd", "payload", "status"]
  assert result["status"] == "success"
  assert result["callback"] == ""
  assert result["cmd"], "userDataStoreInitialized"

     # the datastore may have been created previously, and may have some data items in it.
     # the payload is the data item count
  assert result["payload"] >= 0

#------------------------------------------------------------------------------------------------------------------------
def test_getUserDataStoreSummary():

  print "--- test_getUserDataStoreSummary"

  "connect to a user data store, get a table describing contents"

     #--------------------------------------------------------------------------------
     # first initialize, guaranteeing that the datastore exists (even if empty)
     #--------------------------------------------------------------------------------

  cmd = "initUserDataStore"
  callback = "userDataStoreInitialized"
  payload = {"userID": "test@nowhere.net", "userGroups": ["public", "test"]};
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["status"] == "success"
  itemCount = result["payload"]
  assert itemCount >= 0

  cmd = "getUserDataStoreSummary"
  callback = "handleUserDataStoreSummary"
  payload = {"userID": "test@nowhere.net", "userGroups": ["public", "test"]}; 
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["status"] == "success"

  payload = result["payload"]
  fields = result["payload"].keys()
  fields.sort()
  assert fields == ["colnames", "tbl"]
  colnames = payload["colnames"]
  colnames.sort()
  assert colnames == ['created', 'file', 'group', 'name', 'permissions', 'tags', 'user']
  tbl = payload["tbl"]
  assert len(tbl) == itemCount

#------------------------------------------------------------------------------------------------------------------------
def test_addDataToUserDataStore_1_item():

  print "--- test_getUserDataStoreSummary_1_item, a list of the first 10 integers"

  "connect to a user data store, get a table describing contents"

     #--------------------------------------------------------------------------------
     # first initialize, guaranteeing that the datastore exists (even if empty)
     #--------------------------------------------------------------------------------

  cmd = "initUserDataStore"
  callback = "userDataStoreInitialized"
  payload = {"userID": "test@nowhere.net", "userGroups": ["public", "test"]};
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["status"] == "success"
  itemCount = result["payload"]
  assert itemCount >= 0

     #--------------------------------------------------------------------------------
     # now add a sequence of integers
     #--------------------------------------------------------------------------------

  cmd = "userDataStoreAddData"
  callback = "userDataStoreDataAdded"
  userID = "test@nowhere.net"

  payload = {"userID": userID,
              "userGroups": ["public", "test"], 
             "dataItem": range(1,10),
             "name": "oneToTen",
             "group": "public",
             "permissions": 444,
             "tags": ["numbers", "test data"]};

  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["status"] == "success"
  newItemCount = result["payload"]
  assert newItemCount > itemCount
  displayUserDataStoreSummary(userID)

# test_addDataToUserDataStore_1_item
#------------------------------------------------------------------------------------------------------------------------
def displayUserDataStoreSummary(userID):

  print "--- test_displayUserDataStoreSummary"

  cmd = "getUserDataStoreSummary"
  callback = "handleUserDataStoreSummary"
  payload = {"userID": userID, "userGroups": ["public", "test"]}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert result["status"] == "success"
  payload = result["payload"]
  

#------------------------------------------------------------------------------------------------------------------------
# get the summary table, pick out a dataItemID (currently in the "file" column of the table),
# retrieve it, make sure it is a reasonable value
#
def test_getDataItem():

  print "--- test_getDataItem"

     #----------------------------------------------------------------
     # load the summary table.  at least one item should be there
     # as long as this test is run after test_addDataToUserDataStore_1_item
     # with no intervening delete
     #----------------------------------------------------------------

  userID = "test@nowhere.net"
  cmd = "getUserDataStoreSummary"
  callback = ""
  payload = {"userID": userID, "userGroups": ["public", "test"]}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)

  result = loads(ws.recv())
  assert result["status"] == "success"
  payload = result["payload"]

     # make sure that the item added in a prior test is indeed present
  tbl = payload["tbl"]
  assert len(tbl) > 0;

     #----------------------------------------------------------------
     # get the target
     #----------------------------------------------------------------

  ids = map(lambda x: x[0], tbl)
  assert len(ids) > 0
  target = ids[0]

     #----------------------------------------------------------------
     # get the target's data
     #----------------------------------------------------------------

  cmd = "userDataStoreGetDataItem"
  callback = "do nothing";
  payload = {"userID": userID, "userGroups": ["public", "test"], "dataItemName": target}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)

  result = loads(ws.recv())
  assert result["status"] == "success"
  payload = result["payload"]


    # TODO: this test could (should) go further: 
    #   setup a deterministic state in the datastore, get a specific
    #   dataItem, check for equality
    # further, a wide variety of data types should be stored, and
    # all retrieved reliably

# test_getDataItem
#------------------------------------------------------------------------------------------------------------------------
# get the summary table, pick out a dataItemID (currently in the "file" column of the table), delete it, check that it
# is gone
def test_deleteDataStoreItem():

  print "--- test_deleteDataStoreItem"

     #----------------------------------------------------------------
     # first get a valid dataItemID, for a data item placed there
     # by a preceeding "add" test.
     #----------------------------------------------------------------

  userID = "test@nowhere.net"
  cmd = "getUserDataStoreSummary"
  callback = ""
  payload = {"userID": userID, "userGroups": ["public", "test"]}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)

  result = loads(ws.recv())
  assert result["status"] == "success"
  payload = result["payload"]

     # make sure that at least one item added in a prior test is present
  tbl = payload["tbl"]
  ids = map(lambda x: x[0], tbl)
  assert len(ids) > 0
  target = ids[0]


     #----------------------------------------------------------------
     # delete the target
     #----------------------------------------------------------------

  cmd = "userDataStoreDeleteDataItem";
  callback = "userDataStoreDataItemDeleted"
  payload = {"userID": userID, "userGroups": ["public", "test"], "dataItemName": target}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)

  result = loads(ws.recv())

  assert result["status"] == "success"
  payload = result["payload"]
  assert payload == "'%s' deleted" % target

     #----------------------------------------------------------------
     # make sure the target id is gone
     #----------------------------------------------------------------

  userID = "test@nowhere.net"
  cmd = "getUserDataStoreSummary"
  callback = ""
  payload = {"userID": userID, "userGroups": ["public", "test"]}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)

  result = loads(ws.recv())
  assert result["status"] == "success"
  payload = result["payload"]

  tbl = payload["tbl"]
  ids = map(lambda x: x[0], tbl)
  assert not target in ids

     #----------------------------------------------------------------
     # try to delete a bogus target
     #----------------------------------------------------------------

  target = "bogusTarget"
  cmd = "userDataStoreDeleteDataItem";
  callback = "userDataStoreDataItemDeleted"
  payload = {"userID": userID, "userGroups": ["public", "test"], "dataItemName": target}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)

  result = loads(ws.recv())

  assert result["status"] == "error"
  payload = result["payload"]
  assert payload == "wsUserDataStore, no item named '%s' to delete" % target

# test_deleteDataStoreItem
#------------------------------------------------------------------------------------------------------------------------
def test_survivalCurves():

  print "--- test_survivalCurves"

   #----------------------------------------
   #  use TCGAgbm
   #----------------------------------------

  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "TCGAgbm";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload});
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"
  
   #-------------------------------------------------------------------------------------------------------
   #  choose 5 long survivors: see test_survival: ids <- subset(tbl, Survival > 2800)$ptID[1:sampleCount]
   #-------------------------------------------------------------------------------------------------------
  
  longSurvivors = ["TCGA.06.6693", "TCGA.12.1088", "TCGA.02.0113", "TCGA.02.0114", "TCGA.08.0344"]
   
  cmd = "calculateSurvivalCurves"
  callback = "displaySurvivalCurves"
  payload = {"sampleIDs": longSurvivors, "title": "testWebSocketOperations.py"}
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload});
  ws.send(msg)
  
  result = loads(ws.recv())
  assert result["status"] == "success"
  assert result["cmd"] == callback
  payload = result["payload"]
  assert len(payload) > 10000   # base64 encoded image, coming in as characters
  
#------------------------------------------------------------------------------------------------------------------------
def test_getDrugGeneInteractions():

  print "--- test_getDrugGeneInteractions"

  cmd = "getDrugGeneInteractions"
  geneSymbols = ["HDAC10", "GABRE", "SLC5A4", "MDM2", "OAZ2", "PGR"]
  payload = {"genes": geneSymbols};
  callback = "handleDrugGeneInteractions"
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload});
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]
  fields =  payload.keys()
  assert fields == ['colnames', 'tbl']
  colnames = payload["colnames"]
  assert (colnames == ["gene", "drug", "drugID", "interaction", "source"])
  
  tbl = payload["tbl"]
  assert(len(tbl) > 10)  # actually 186 on (24 jul 2015)
  assert(len(tbl[0]) == len(colnames))
  
    # make sure the geneSymbols returned are actually in the input list
  assert(tbl[0][0] in geneSymbols)
  
    # now try bogus geneSymbols which will never be matched
  geneSymbols = ["moeBogus", "curlyBogus", "", "harpoBogus"]
  payload = {"genes": geneSymbols};
  callback = "handleDrugGeneInteractions"
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload});
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]
  fields =  payload.keys()
  assert fields == ['colnames', 'tbl']
  colnames = payload["colnames"]
  assert (colnames == ["gene", "drug", "drugID", "interaction", "source"])

  tbl = payload["tbl"]
  assert(len(tbl) == 0)

#------------------------------------------------------------------------------------------------------------------------
def test_pca():

  print "--- test_pca"

  test_pcaCreateWithDataSet()
  test_pcaCalculate()

#------------------------------------------------------------------------------------------------------------------------
def test_pcaCreateWithDataSet():

  print ("--- test_pcaCreateWithDataSet");

    # two mRNA expression matrices in DEMOdz: 
    #   "mtx.mrna.ueArray" "mtx.mrna.bc"

  payload = {"dataPackage": "DEMOdz", "matrixName": "mtx.mrna.ueArray"}
  
  msg = dumps({"cmd": "createPCA", "status":"request", 
               "callback": "pcaCreatedHandler", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"];
  assert(payload.find("PCA package, matrices:") >= 0)

#------------------------------------------------------------------------------------------------------------------------
def test_pcaCalculate():

  "calculates pca on DEMOdz, the full mrna matrix, using pca object created above"

  print "--- test_pcaCalculate"

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
  assert(len(ids) >= 20)
  assert(ids.index('TCGA.02.0003.01') >= 0)
  
  assert(payload["maxValue"] > 10)
  
  assert(payload["importance.PC1"] > 0.0)
  assert(payload["importance.PC2"] > 0.0)

#------------------------------------------------------------------------------------------------------------------------
def test_plsr():

  print "--- test_plsr"

   #------------------------------------------------------------
   # first specify currentDataSet
   #------------------------------------------------------------
  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  
  assert result["payload"]["datasetName"] == dataset;
  assert result["cmd"] == callback
  assert result["status"] == "success"


  test_plsrCreateWithDataSet()
  test_plsrSummarizePLSRPatientAttributes()
  test_plsrCalculateSmallOneFactor()
  test_plsrCalculateSmallTwoFactors()
  testManyGenesTwoFactors()

#------------------------------------------------------------------------------------------------------------------------
def test_plsrCreateWithDataSet():

  "sends dataset as a named string, gets back show method's version of the dataset object"

  print "--- testCreateWithDataSet"

    # two mRNA expression matrices in DEMOdz: 
    #   "mtx.mrna.ueArray" "mtx.mrna.bc"

  payload = {"dataPackage": "DEMOdz", "matrixName": "mtx.mrna.ueArray"}

  msg = dumps({"cmd": "createPLSR", "status":"request", 
               "callback":"PLSRcreatedHandler", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"];
  assert(payload.find("PLSR package, matrices:") >= 0)

#------------------------------------------------------------------------------------------------------------------------
def test_plsrSummarizePLSRPatientAttributes():

  "gets five-number summary of any numerical attribute in the patient history table"

  print "--- testSummarizePLSRPatientAttributes"
  payload = ["AgeDx"]
      
  msg = dumps({"cmd": "summarizePLSRPatientAttributes", "status":"request", 
                 "callback":"handlePlsrClincialAttributeSummary", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["status"] == "success")
  assert(result["cmd"] == "handlePlsrClincialAttributeSummary")
  assert(result["payload"]["AgeDx"] ==  [9369, 15163.5, 19153, 25736, 31566])
    
       # send a second reqauest, but one guaranteed to fail
  payload = "bogus"
  msg = dumps({"cmd": "summarizePLSRPatientAttributes", "status":"request", 
                 "callback":"handlePlsrClincialAttributeSummary", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"]["bogus"] == None)

#----------------------------------------------------------------------------------------------------
def test_plsrCalculateSmallOneFactor():
  "calculates plsr on DEMOdz, with two patient groups, low and high AgeDx (age at diagnosis)"

  print "--- testCalculateSmallOneFactor"

    # in R: sample(colnames(matrices(getDataPackage(myplsr))$mtx.mrna), size=10)
  genesOfInterest = ["ELL","EIF4A2","ELAVL2","UPF1","EGFR","PRPSAP2","TTPA","PIGP","TTN","UNC45A"]
      
  factor = {"name": "AgeDx", "low": 12000, "high": 2800}
    
  payload = {"genes": genesOfInterest, "factorCount": 1, "factors": [factor]};
    
  msg = dumps({"cmd": "calculatePLSR", "status":"request", 
                 "callback":"handlePlsrResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePlsrResult")
  assert(result["status"] == "success")
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
  maxValue = payload["maxValue"]
  assert(maxValue == 0.8187)

#----------------------------------------------------------------------------------------------------
def test_plsrCalculateSmallTwoFactors():
  "calculates plsr on DEMOdz, with two patient groups, low and high AgeDx (age at diagnosis)"

  print "--- test_plsrCalculateSmallTwoFactors"

    # in R: sample(colnames(matrices(getDataPackage(myplsr))$mtx.mrna), size=10)
  genesOfInterest = ["ELL","EIF4A2","ELAVL2","UPF1","EGFR","PRPSAP2","TTPA","PIGP","TTN","UNC45A"]
    
  factor1 = {"name": "AgeDx", "low": 12000, "high": 2800}
  factor2 = {"name": "Survival", "low": 20, "high": 3000}
  
  payload = {"genes": genesOfInterest, "factorCount": 2, "factors": [factor1, factor2]};
  
  msg = dumps({"cmd": "calculatePLSR", "status":"request", 
               "callback":"handlePlsrResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePlsrResult")
  assert(result["status"] == "success")
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
  maxValue = payload["maxValue"]
  print maxValue
  assert(maxValue == 0.7946)

#------------------------------------------------------------------------------------------------------------------------
# i developed this test (pshannon, 25 sep 2015) to probe a very confusing bug, which turned out to
# be caused a problem in wsPLSR.calculate_plsr:
#    factors.df <- msg$payload$factors
#    factors <- apply(factors.df, 1, as.list)
# which converted the numeric values in the two factors into strings; the shorter strings had leading
# white sace.
# after hours (!) of snooping, this change fixed the problem:
#   factors <- vector("list", nrow(factors.df))
#   for(r in 1:nrow(factors.df)){
#      factors[[r]] <- as.list(factors.df[r,])
#     } # for r
#
#
def testManyGenesTwoFactors():

  "calculates plsr on DEMOdz, with two patient groups, low and high AgeDx (age at diagnosis), many genes"

  print "--- test_ManyGenesTwoFactors"

    # in R: sample(colnames(matrices(getDataPackage(myplsr))$mtx.mrna), size=10)
  genesOfInterest = ["PRRX1", "UPF1", "PIPOX", "PIM1", "UCP2", "USH2A", "TTN", "ELF4", "U2AF1",
                     "ELOVL2", "PIK3C2B", "PTPRA", "USP6", "EDIL3", "PTPN14", "EHD2", "EGFR",
                     "PIK3CG", "ELK4", "TTC3", "EIF4A2", "PIK3R2", "EMP3", "PIK3CA", "TTC28", "EED",
                     "UGT8", "PLAUR", "PTEN", "EEF2", "PTPN6", "PTK2", "TTPA", "PIK3CD", "PTPN22",
                     "PRR4", "EML4", "PTBP1", "UBR5", "TYK2"];

  factor1 = {"name": "AgeDx", "low": 16435.80, "high": 24105.84}
  factor2 = {"name": "Survival", "low": 1096.72, "high": 2556.68}
  
  payload = {"genes": genesOfInterest, "factorCount": 2, "factors": [factor1, factor2]};
  
  msg = dumps({"cmd": "calculatePLSR", "status":"request", 
               "callback":"handlePlsrResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["cmd"] == "handlePlsrResult")
  assert(result["status"] == "success")
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
  for i in range(0,4):
     assert(abs(vectors[i][0]) > 0)
     assert(abs(vectors[i][1]) > 0)

  assert(len(loadings) == len(genesOfInterest))
  maxValue = payload["maxValue"]
  assert(maxValue > 0.50)
  assert(maxValue < 0.60)

#------------------------------------------------------------------------------------------------------------------------
def test_eventLogging():

  print "--- test_eventLogging"

  cmd = "specifyCurrentDataset"
  callback = "datasetSpecified"
  dataset = "DEMOdz";
  payload = dataset
  
     # set a legitimate dataset
  msg = dumps({"cmd": cmd, "status": "request", "callback": callback, "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())
  payload = result["payload"]
  assert(payload.keys() == ['datasetName', 'mtx', 'rownames', 'colnames'])
  assert(payload["rownames"][0:2] == ['mtx.mrna.ueArray.RData', 'mtx.mrna.bc.RData'])
  assert(result["cmd"] == callback)
  
     # for now, an absolutely minimal test:  just log one event
  #payload = {"eventName": "test", "eventStatus": "request", "moduleOfOrigin": "python ws tester", "comment": "no comment"};
  #msg = dumps({"cmd": "logEvent", "status": "request", "callback": "", "payload": payload})
  #ws.send(msg)
  #result = loads(ws.recv())

#------------------------------------------------------------------------------------------------------------------------
interactive = (sys.argv[0] != "testWebSocketOperations.py")
if(not(interactive)):
  runTests()
