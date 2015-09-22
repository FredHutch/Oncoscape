library(httpuv)
library(jsonlite)
library(PLSR)
library(DEMOdz)
#----------------------------------------------------------------------------------------------------
wsCon <- new.env(parent=emptyenv())
dispatchMap <- new.env(parent=emptyenv())
# dz <- DEMOdz()
# plsr <- PLSR(dz)
#----------------------------------------------------------------------------------------------------
deploy <- function(port=9013, quiet=FALSE)
{
  setupMessageHandlers()

  wsCon <- .connect(wsCon)

  errorFunction <- function(e){
     stop(sprintf("failed to open websocket on port %d", port));
     }
  finallyFunction <- function(e){
     message(sprintf("daemonized web socket server finalized"));
     }

  if(!quiet)
     message(sprintf("running server on port %d", port))

  wsCon$wsID <- tryCatch(runServer("0.0.0.0", port, wsCon),
                         error=errorFunction, finally=finallyFunction);
  
  wsCon

} # deploy
#----------------------------------------------------------------------------------------------------
.connect <- function(wsCon)
{
   wsCon$open <- FALSE
   wsCon$wsID <- NULL
   wsCon$ws <- NULL
   wsCon$result <- NULL
     # process http requests
   wsCon$call = function(req) {
      wsUrl = paste(sep='', '"', "ws://",
                   ifelse(is.null(req$HTTP_HOST), req$SERVER_NAME, req$HTTP_HOST),
                   '"')
     list(
       status = 200L,
       headers = list('Content-Type' = 'text/html'),
       body = c(file=browserFile))
       }

      # called whenever a websocket connection is opened
   wsCon$onWSOpen = function(ws) {   
      #printf("---- wsCon$onWSOpen");
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
         printf("-- new message arrived")
         print(message)
         wsCon$lastMessage <- message
         if(!is(message, "list")){
            message("message: new websocket message is not a list");
            return;
            }
         if (! "cmd" %in% names(message)){
            message("error: new websocket messages has no 'cmd' field");
            return;
            }
         cmd <- message$cmd
         dispatchMessage(ws, message);
         printf("mesage received, cmd: %s", cmd);
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .connect
#--------------------------------------------------------------------------------
close <- function()
{
  if(!wsCon$open){
      warning("websocket server is not open, cannot close");
      return()
      }
  wsCon$open <- FALSE
  stopServer(wsCon$wsID)
  wsCon$ws <- NULL
  wsCon$ws <- -1

} # close
#--------------------------------------------------------------------------------
addRMessageHandler <- function(key, functionName)
{
   dispatchMap[[key]] <- functionName
    
} # addRMessageHandler
#---------------------------------------------------------------------------------------------------
dispatchMessage <- function(ws, msg)
{
   printf("entering dispatchMessage")
   print(msg)
   
   if(!msg$cmd %in% ls(dispatchMap)){
       message(sprintf("dispatchMessage error!  the incoming cmd '%s' is not recognized", msg$cmd))
       return()
       }

   function.name <- dispatchMap[[msg$cmd]]
   printf("function.name found: %s", function.name)
   success <- TRUE   

   if(is.null(function.name)){
       message(sprintf("dispatchMessage error!  cmd ('%s') not recognized", msg.cmd))
       success <- FALSE
       return()
       }
   
   tryCatch(func <- get(function.name), error=function(m) func <<- NULL)

   if(is.null(func)){
       message(printf("dispatchMessage error!  cmd ('%s') recognized but no corresponding function",
              msg$cmd))
       success <- FALSE
       }

   if(success)
       do.call(func, list(ws, msg))

} # dispatchMessage
#---------------------------------------------------------------------------------------------------
setupMessageHandlers <- function()
{
   addRMessageHandler("echo", "echoHandler")
   addRMessageHandler("createPLSR", "createPLSR")
   addRMessageHandler("calculatePLSR", "calculate_plsr")
   addRMessageHandler("summarizePLSRPatientAttributes", "summarizePLSRPatientAttributes")
   
} # setupMessageHandlers
#----------------------------------------------------------------------------------------------------
echoHandler <- function(ws, msg)
{
   printf("received echo request");

   if("payload" %in% names(msg))
      outgoing.payload <- sprintf("hello from PLSR/inst/ws/wsWrapper.py: %s", msg$payload)
   else
      outgoing.payload <- "no incoming payload"
   
   ws$send(toJSON(list(cmd="echoBack", callback="", status="response", payload=outgoing.payload)))

} # echoHandler
#----------------------------------------------------------------------------------------------------
# for accurate testing, and subsequent reliable use, all code below here should
# be reproduced exactly in the Oncoscape package in which the PLSR class is needed.
# a better way is needed to make these functions available here, for testing, and elsewhere,
# for deployment.
createPLSR <- function(ws, msg)
{
   printf("=== createPLSR");

   print(msg$payload)
   dataPackageName = msg$payload$dataPackage
   matrixName = msg$payload$matrixName
   require(dataPackageName, character.only=TRUE)
      # a bit of R magic: create and run an R expression from text
      # this creates a real variable, ds, which is an object of whatever dataSetName names
   eval(parse(text=sprintf("ds <- %s()", dataPackageName)))

   cmd <- sprintf("myplsr <<- PLSR(ds, '%s')", matrixName);
   eval(parse(text=cmd))

   response <- plsrDataSummary(myplsr)
   
   ws$send(toJSON(list(cmd=msg$callback, callback="", status="response", payload=response)))

} # createPLSR
#----------------------------------------------------------------------------------------------------
calculate_plsr <- function(ws, msg)
{
   printf("=== calculate_PLSR");
   print(msg)
   genes <- msg$payload$genes
   print(genes)
   factors.df <- msg$payload$factors
   factors <- apply(factors.df, 1, as.list)
   print(factors)
   x <- calculatePLSR(myplsr, factors, genes)
   payload <- list(loadings=x$loadings,
                   loadingNames=rownames(x$loadings),
                   vectors=x$loadVectors,
                   vectorNames=rownames(x$loadVectors),
                   maxValue=x$maxValue)
   ws$send(toJSON(list(cmd=msg$callback, callback="", status="response", payload=payload)))

} # calculate_plsr
#----------------------------------------------------------------------------------------------------
summarizePLSRPatientAttributes <- function(ws, msg)
{
   printf("=== summarizePLSRPatientAttributes")
   print(msg)
   
   attributes <- msg$payload

   print("------------ myplsr")
   print(myplsr)
   summary <- summarizeNumericPatientAttributes(myplsr, attributes)
   print("------------ summary returned");
   print(summary)
   status <- "to be examined element by element"
   payload <- summary

   ws$send(toJSON(list(cmd=msg$callback, callback="", status=status, payload=payload)))

} # summarizePLSRPatientAttributes
#----------------------------------------------------------------------------------------------------
deploy()
