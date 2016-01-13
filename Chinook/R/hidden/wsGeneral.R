addRMessageHandler("ping", "ping");
addRMessageHandler("getServerVersion", "getServerVersion");
addRMessageHandler("getSampleDataFrame", "getSampleDataFrame");
addRMessageHandler("checkPassword", "checkPassword");
addRMessageHandler("logEvent", "logEvent");
addRMessageHandler("getLoggedEvents", "getLoggedEvents");
addRMessageHandler("exitAfterTesting", "exitAfterTesting");
#----------------------------------------------------------------------------------------------------
state[["log"]] <- data.frame(eventName=character(),
                             eventStatus=character(),
                             secs=numeric(),
                             userID=character(),
                             moduleOfOrigin=character(),
			     dataset=character(),
                             time=character(),
                             version=character(),
                             comment=character(),
			     stringsAsFactors=FALSE);

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
logEvent <- function(ws, msg)
{
  payload <- msg$payload
  field.names <- names(payload)
  printf("--- field.names: %d", length(field.names))
  print(field.names)
  stopifnot(sort(field.names) == c("comment", "eventName", "eventStatus", "moduleOfOrigin"))

   # secs, dataset, time, version are all obtained locally

  datasetName <- "NA"
  key <- "currentDatasetName"
  if(key %in% ls(state))
    datasetName <- state[[key]]

  userID <- "NA"
  key <- "userID"
  if(key %in% ls(state))
    userID <- state[[key]]

  version <- sessionInfo()$otherPkgs$OncoDev14$Version
  time <- Sys.time()
  secs <- as.numeric(time)
 
  new.event <- list(eventName=payload$eventName,
                    eventStatus=payload$eventStatus,
                    secs=secs,
                    userID=userID,
                    moduleOfOrigin=payload$moduleOfOrigin,
		    dataset=datasetName,
                    time=as.character(time),
                    version=version,
                    comment=payload$comment);

  state[["log"]] <- rbind(state[["log"]], as.data.frame(new.event, stringsAsFactors=FALSE))
  print(new.event)
  # saveLog()
  
} # logEvent
#----------------------------------------------------------------------------------------------------
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

  column.names <- colnames(tbl)
  mtx <- as.matrix(tbl)
  payload <- list(colnames=column.names, tbl=mtx)
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
  #payload <- toJSON(tbl)
  #return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

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
getLoggedEvents <- function(ws, msg)
{
  tbl <- state[["log"]]
  print(1)
  print(tbl)
  column.names <- colnames(tbl)
  print(column.names);
  print(2)
  mtx <- as.matrix(tbl)
  print(mtx)
  print(3)
  payload <- list(colnames=column.names, tbl=mtx)
  print(4)

  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
  print(5)
  ws$send(toJSON(return.msg))
  print(6)

} # getLoggedEvents
#----------------------------------------------------------------------------------------------------
saveLog <- function()
{
   if("log" %in% ls(state)){
      log <- state[["log"]]
      filename <- sprintf("log.%s.RData", gsub(":", ".", gsub(" ", ".", Sys.time())))
      full.path <- file.path(getwd(), filename);
      message(sprintf("saving log to %s", full.path))
      save(log, file=full.path)
      }

} # saveLog
#----------------------------------------------------------------------------------------------------
exitAfterTesting <- function(ws, msg)
{
   
   payload <- msg$payload
   error.count <- payload$errorCount
   errors <- payload$errrs;

   saveLog()    
   message("tests complete, oncoscape server now exiting")
   quit(save="no", status=error.count, runLast=FALSE);

} # exitAfterTesting
#----------------------------------------------------------------------------------------------------
