addRMessageHandler("ping", "ping");
addRMessageHandler("getServerVersion", "getServerVersion");
addRMessageHandler("getSampleDataFrame", "getSampleDataFrame");
addRMessageHandler("checkPassword", "checkPassword");
#----------------------------------------------------------------------------------------------------
# this file providees the standard oncoscape websocket json interface to SttrDataSet objects
# each of which is typically matrices of experimental data, a clinical history, and variaout
# annotations
# the datasests object is an environment containing dataset objects, specified to Oncoscape as dataset
# names whose packages are then dynmically require'd, whose constructor is then called, the resulting
# object stored by name in the environment
#
# these functions are tested by inst/unitTests/testWebSocketOperations.py
#----------------------------------------------------------------------------------------------------
# most basic test of ws/json good health
ping <- function(ws, msg)
{
  payload <- sprintf("%s %s", msg$payload, date())
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
  ws$send(toJSON(return.msg))
  
} # ping
#----------------------------------------------------------------------------------------------------
# consruct an object, call the verersionMethod on it, return the string (should be in x.y.z)
# TODO: seems burdensome to create an Onco object here.  rethink at some point.
getServerVersion <- function(ws, msg)
{
  serverVersion <- sessionInfo()$otherPkgs$OncoDev14$Version;
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=serverVersion)
  ws$send(toJSON(return.msg))
  
} # getServerVersion
#----------------------------------------------------------------------------------------------------
# send a 2-row, 3-column data.frame 
getSampleDataFrame <- function(ws, msg)
{
  tbl <- data.frame(integers=1:2, strings=c("ABC", "def"), floats=c(3.14, 2.718),
                    stringsAsFactors=FALSE, row.names=c("rowOne", "rowTwo"))
  payload <- toJSON(tbl)
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
  ws$send(toJSON(return.msg))
  
} # getSampleDataFrame
#----------------------------------------------------------------------------------------------------
checkPassword <- function(ws, msg)
{
   printf("--- starting checkPassword");
   print(msg)

   return.msg <- list(cmd=msg$callback, status="failure", callback="", payload="Incorrect password");

   password.to.match <- state[["password"]]
   printf("password to match: %s", password.to.match)

   if(is.na(password.to.match) || msg$payload == password.to.match){
      return.msg <- list(cmd=msg$callback, status="success", callback="", payload="");
      } # if password is good

   ws$send(toJSON(return.msg))
   printf("--- leaving checkPassword");

} # checkPassword
#----------------------------------------------------------------------------------------------------
