from websocket import create_connection
from json import *
from urllib.request import urlopen
from urllib.parse import quote
#----------------------------------------------------------------------------------------------------
PORT = 6001
ws = create_connection("ws://localhost:%d" % PORT)
#wsAux = create_connection("ws://localhost:%d" % (PORT+1))
#----------------------------------------------------------------------------------------------------
# make chinook 4-field json request over websocket
def sendWsMain(cmd, payload):

   msg = dumps({"cmd": cmd, "status":"request", "callback":"", "payload": payload})
   ws.send(msg)
   result = loads(ws.recv())
   return(result["payload"])

#----------------------------------------------------------------------------------------------------
# make chinook 4-field json request over websocket
#def sendWsAux(cmd, payload):
#
#   msg = dumps({"cmd": cmd, "status":"request", "callback":"", "payload": payload})
#   wsAux.send(msg)
#   result = loads(wsAux.recv())
#   return(result["payload"])
#
#----------------------------------------------------------------------------------------------------
# do a simple get, check a "hello" comes back
def checkMainBasicHttpResponse():

   response = urlopen("http://localhost:%d" % PORT).read().decode()
   print("main response: %s" % response)
   assert(response == 'hello from ChinookServer main port')
   print("http server running fine on main port %d" % PORT)
   
#----------------------------------------------------------------------------------------------------
# do a simple get, check a "hello" comes back
#def checkAuxBasicHttpResponse():
#
#   response = urlopen("http://localhost:%d" % (PORT + 1)).read().decode()
#   print("aux response: %s" % response)
#   assert(response == 'hello from ChinookServer auxiliary port')
#   print("http server running fine on aux port %d" % (PORT + 1))
#   
#----------------------------------------------------------------------------------------------------
# make chinook 4-field json request over http
def sendHttpMain(cmd, payload):

   msg = quote(dumps({"cmd": cmd, "status":"request", "callback":"", "payload": payload}))
   request = "http://localhost:%s?jsonMsg='%s'" % (PORT, msg)
   rawResult = urlopen(request).read()
   result = loads(rawResult.decode())   # bytes.decode()
   payload = result["payload"]
   return(payload)

#----------------------------------------------------------------------------------------------------
# make chinook 4-field json request over http
#def sendHttpAux(cmd, payload):
#
#   msg = quote(dumps({"cmd": cmd, "status":"request", "callback":"", "payload": payload}))
#   request = "http://localhost:%s?jsonMsg='%s'" % ((PORT+1), msg)
#   rawResult = urlopen(request).read()
#   result = loads(rawResult.decode())   # bytes.decode()
#   payload = result["payload"]
#   return(payload)
#
#----------------------------------------------------------------------------------------------------
# make chinook 4-field json request over http
#def sendHttpAuxToBrowser(cmd, payload):
#
#   msg = quote(dumps({"cmd": cmd, "status": "forBrowser", "callback":"", "payload": payload}))
#   request = "http://localhost:%s?jsonMsg='%s'" % ((PORT+1), msg)
#   rawResult = urlopen(request).read()
#   result = loads(rawResult.decode())   # bytes.decode()
#   payload = result["payload"]
#   return(payload)
#
#----------------------------------------------------------------------------------------------------
#checkMainBasicHttpResponse();
#checkAuxBasicHttpResponse();

messageNames = sendHttpMain("getRegisteredMessageNames", "")
messageNames2 = sendWsMain("getRegisteredMessageNames", "")
assert(messageNames2 == messageNames)

#messageNames3 = sendHttpAux("getRegisteredMessageNames", "")
#assert(messageNames3 == messageNames)
#messageNames4 = sendWsAux("getRegisteredMessageNames", "")
#assert(messageNames4 == messageNames)

#msgNames = send("getRegisteredMessageNames", "")
#assert('deleteVariable' in msgNames)
#assert('getDatasetNames' in msgNames)
#assert('getRegisteredMessageNames' in msgNames)
#assert('getVariable' in msgNames)
#assert('getVariableNames' in msgNames)
#assert('setVariable' in msgNames)
#assert('specifyCurrentDataset' in msgNames)
#
#assert(len(send("getVariableNames", "")) == 0)
#
#send("setVariable", {"name": "foo", "value": 99})
#   # just one variable name, thus not a list, thus just a simple string
#assert(send("getVariableNames", "") == 'foo')
#send("setVariable", {"name": "bar", "value": {"id": 32, "species": "doug fir", "height": 120, "units": "meters"}})
#assert(len(send("getVariableNames", "")) == 2)
#assert(send("getVariable", {"name": "bar"})["value"]["species"] == "doug fir")
#send("deleteVariable", {"name": "bar"})
#send("deleteVariable", {"name": "foo"})
#assert(len(send("getVariableNames", "")) == 0)
#print("all tests passed")


