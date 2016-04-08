import sys
from websocket import create_connection
from json import *
ws = create_connection("ws://localhost:9006")



shortSurvivors0 = ["TCGA.19.2624", "TCGA.12.0657", "TCGA.06.0140", "TCGA.06.0402", "TCGA.41.4097", "TCGA.06.0201",
                  "TCGA.14.3476", "TCGA.32.1976", "TCGA.06.0213", "TCGA.19.0962", "TCGA.02.0439", "TCGA.06.0219",
                  "TCGA.08.0392", "TCGA.14.1043", "TCGA.41.2571", "TCGA.14.0781", "TCGA.14.1455", "TCGA.14.1794",
                  "TCGA.41.3392", "TCGA.06.0750"]

longSurvivors0 = ["TCGA.12.1088", "TCGA.06.6693", "TCGA.08.0344", "TCGA.02.0114", "TCGA.12.0656", "TCGA.12.0818",
                 "TCGA.02.0028", "TCGA.02.0080", "TCGA.02.0014", "TCGA.02.0021", "TCGA.06.0409", "TCGA.08.0351", 
                 "TCGA.02.0104", "TCGA.12.3644", "TCGA.08.0517", "TCGA.06.0164", "TCGA.12.0772", "TCGA.02.0024",
                 "TCGA.02.0085", "TCGA.15.1444"]
shortSurvivors = ["TCGA.06.0194", "TCGA.08.0345", "TCGA.08.0510", "TCGA.12.0657", "TCGA.28.1747",
                   "TCGA.76.6193", "TCGA.02.0071", "TCGA.06.0142", "TCGA.02.0456", "TCGA.76.4925",
                   "TCGA.02.0060", "TCGA.32.1980", "TCGA.02.0333", "TCGA.02.0003", "TCGA.14.1795",
                   "TCGA.06.2559", "TCGA.14.1794", "TCGA.06.5418", "TCGA.06.0649", "TCGA.19.1790",
                   "TCGA.19.1789", "TCGA.14.1401", "TCGA.14.3476", "TCGA.41.3392", "TCGA.19.A6J4",
                   "TCGA.76.4934", "TCGA.19.2624", "TCGA.27.2526", "TCGA.14.0862", "TCGA.19.1788",
                   "TCGA.06.0173", "TCGA.12.5299", "TCGA.28.5218", "TCGA.06.A6S0", "TCGA.41.4097",
                   "TCGA.14.1396", "TCGA.06.0197", "TCGA.06.0219", "TCGA.08.0385", "TCGA.06.5856"]
longSurvivors = [ "TCGA.08.0516", "TCGA.41.2572", "TCGA.02.0023", "TCGA.02.0079", "TCGA.06.0141",
                  "TCGA.76.6286","TCGA.14.0866", "TCGA.19.1787", "TCGA.08.0509", "TCGA.12.0662",
                  "TCGA.02.0028", "TCGA.06.1806", "TCGA.12.0707", "TCGA.02.0001", "TCGA.14.0790",
                  "TCGA.06.0130", "TCGA.06.2558", "TCGA.27.1835", "TCGA.06.0155", "TCGA.08.0349",
                  "TCGA.06.0124", "TCGA.12.1599", "TCGA.08.0358", "TCGA.02.0339", "TCGA.02.0106",
                  "TCGA.27.1834", "TCGA.02.0326", "TCGA.12.0769", "TCGA.14.0783", "TCGA.12.0653",
                  "TCGA.08.0514", "TCGA.02.0006", "TCGA.76.4932", "TCGA.02.0266", "TCGA.14.1823",
                  "TCGA.14.1037", "TCGA.02.0051", "TCGA.08.0348", "TCGA.06.0165", "TCGA.06.5408"]

#------------------------------------------------------------------------------------------------------------------------
def runTests():

  testEcho()
  test_set40()


#------------------------------------------------------------------------------------------------------------------------
def testEcho():
  "sends the echo command with payload, expects 'payload-payload' in return"

  print "--- testEcho"

  msg = dumps({"cmd": "echo", "status":"request", "callback":"", "payload": "python"})
  ws.send(msg)
  result = loads(ws.recv())
  assert(result["payload"] == "python-python")

#------------------------------------------------------------------------------------------------------------------------
def test_set40():

  "sends score request with short and long survivors, one interesting geneset"

  print "--- test_set40"

  payload = {"group1": shortSurvivors, "group2": longSurvivors, "geneset": ["KANG_CISPLATIN_RESISTANCE_DN"]}
  msg = dumps({"cmd": "geneSetScoreTest", "status":"request", "callback": "handleScoreResult", "payload": payload})
  ws.send(msg)
  result = loads(ws.recv())

  assert(result["cmd"] == "handleScoreResult")
  data = loads(result["payload"])
  print data
  #assert(len(data.keys()) == 1)
  #assert(data.keys()[0] == 'BIOCARTA_MCM_PATHWAY')


interactive = (sys.argv[0] != "testWrapper.py")
if(not(interactive)):
  runTests()

