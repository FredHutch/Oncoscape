# ChinookServer: a refactored oncoscape, intended for one dedicated R session per user
#------------------------------------------------------------------------------------------------------------------------
.ChinookServer <- setClass("ChinookServer",
         representation(wsServer="environment",
                        port="integer",
                        browserFile="character",
                        userCredentials="character",
                        datasetNames="character",
                        analysisPackageNames="character",
                        currentDatasetName="character",
                        state="environment",
                        dispatchMap="environment")
         )

#------------------------------------------------------------------------------------------------------------------------
setGeneric("run",                  signature="self", function(self) standardGeneric("run"))
setGeneric("port",                 signature="self", function(self) standardGeneric("port"))
setGeneric("getAnalysisPackageNames",  signature="self", function(self) standardGeneric("getAnalysisPackageNames"))
setGeneric("getDatasetNames",          signature="self", function(self) standardGeneric("getDatasetNames"))
setGeneric("getDatasetByName",     signature="self", function(self, datasetName) standardGeneric("getDatasetByName"))
setGeneric("setActiveDataSet",     signature="self", function(self, dataSetName) standardGeneric("setActiveDataSet"))
setGeneric("getActiveDataSet",     signature="self", function(self) standardGeneric("getActiveDataSet"))
setGeneric('close',                signature="self", function(self) standardGeneric("close"))
setGeneric("serverVersion",        signature="self", function(self) standardGeneric("serverVersion"))
setGeneric("addMessageHandler",    signature="self", function(self, messageName, functionToCall) standardGeneric("addMessageHandler"))
setGeneric("getMessageNames",      signature="self", function(self) standardGeneric("getMessageNames"))
setGeneric('registerMessageHandlers', signature='obj', function (obj) standardGeneric ('registerMessageHandlers'))
#------------------------------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#------------------------------------------------------------------------------------------------------------------------
# web socket protocols seem to require that simple functions be used for configuation, but some object
# state can be needed.  this unexported file-local variable works around that.
local.state <- new.env(parent=emptyenv())
#------------------------------------------------------------------------------------------------------------------------
# constructor
ChinookServer = function(port=NA_integer_, analysisPackageNames=NA_character_, datasetNames=NA_character_,
                         browserFile=NA_character_, userCredentials=NA_character_)
{
   printf("ChinookServer ctor, datasetNames: %s", paste(datasetNames, collapse=","))
   
   state <- new.env(parent=emptyenv())
   state[["userCredentials"]] <- userCredentials
   state[["currentDatasetName"]] <- NA_character_

   dispatchMap <- new.env(parent=emptyenv())
   wsCon <- new.env(parent=emptyenv())
   
   server <- .ChinookServer(wsServer=wsCon,
                            port=as.integer(port),
                            browserFile=browserFile,
                            userCredentials=userCredentials,
                            datasetNames=datasetNames,
                            analysisPackageNames=analysisPackageNames,
                            currentDatasetName=NA_character_,
                            state=state,
                            dispatchMap=dispatchMap)
   
   .loadDataPackages(server, datasetNames)
   .loadAnalysisPackages(server, analysisPackageNames)

   wsCon <- .setupWebSocketHandlers(server, wsCon, browserFile)
   server@wsServer <- wsCon

   state[["auxPortState"]] <- AuxPort(wsCon, port+1)
   local.state[["server"]] <- server
   registerMessageHandlers(server)
   
   server

} # ctor
#------------------------------------------------------------------------------------------------------------------------
# the semantics of toJSON changed between RJSONIO and jsonlite: in the latter, scalars are
# promoted to arrays of length 1.  rather than change our javascript code, and since such
# promotion -- while sensible in the context of R -- strikes me as gratuitous, I follow
# jeroen ooms suggestion, creating this wrapper
toJSON <- function(..., auto_unbox = TRUE)
{
  jsonlite::toJSON(..., auto_unbox = auto_unbox)
}
#------------------------------------------------------------------------------------------------------------------------
.loadDataPackages <- function(server, datasetNames)
{
   printf("ChinookServer.loadDataPackages");
   for(datasetName in datasetNames){
     printf("ChinookServer:.loadDataPackages: %s", datasetName);
     load.string <- sprintf("require(%s, quietly=TRUE)", datasetName)
     tryCatch(eval(parse(text=load.string)), error=function(e) {
        message(sprintf("failed to load dataset '%s'", datasetName))
        })
     if(exists(datasetName)){
        instantiation.string <- sprintf("dz <- %s()", datasetName, datasetName)
        duration <- system.time(tryCatch(eval(parse(text=instantiation.string)),
                                error=function(e)
                                message(sprintf("failure calling constructor for '%s'", datasetName))))[["elapsed"]]
         
        stopifnot('Dataset' %in% is(dz))
        chinookDataset <- ChinookDataset(datasetName, dz)
        setServer(chinookDataset, server)
        registerMessageHandlers(chinookDataset)
        assignment.string <- sprintf("server@state[['%s']] <- chinookDataset", datasetName)
        eval(parse(text=assignment.string))
        message(sprintf("ChinookServer loading: %40s %7.2f seconds", assignment.string, duration))
        #message(sprintf("  new list of instantiated datasets: %s",
        #                paste(ls(self@stateasets), collapse=",")))
        } # if data package successfully loaded, ctor defined
     } # for datasetName

   #printf("=== datasets now available to the server: %s", paste(ls(instantiated.datasets), collapse=","))
    
} # .loadDataPackages
#------------------------------------------------------------------------------------------------------------------------
.loadAnalysisPackages <- function(server, analysisPackageNames)
{
   printf("ChinookServer.loadAnalysisPackages");
    
   for(packageName in analysisPackageNames){
     printf("ChinookServer:.loadAnalysisPackages: %s", packageName);
     load.string <- sprintf("require(%s, quietly=TRUE)", packageName)
     tryCatch(eval(parse(text=load.string)), error=function(e) {
        message(sprintf("failed to load analysis package '%s'", packageName))
        })
     if(exists(packageName)){
        instantiation.string <- sprintf("pkg <- %s(server)", packageName);
        printf("about to eval instantiation.string: %s", instantiation.string)
        duration <- system.time(tryCatch(eval(parse(text=instantiation.string)),
                                error=function(e)
                                message(sprintf("failure calling constructor for '%s'", packageName))))[["elapsed"]]
         
        stopifnot('ChinookAnalysis' %in% is(pkg))
        storePkg.string <- sprintf("server@state[['%s']] <- pkg", packageName)
        eval(parse(text=storePkg.string))
        message(sprintf("ChinookServer loading: %40s %7.2f seconds", storePkg.string, duration))
        #message(sprintf("  new list of instantiated.analysisPackages: %s",
        #                paste(ls(instantiated.analysisPackages), collapse=",")))
        } # if analysis package successfully loaded, ctor defined
     } # for packageName

   #printf("=== analysis packages now available to the server: %s",
   #       paste(ls(instantiated.analysisPackages), collapse=","))
    
} # .loadAnalysisPackages
#------------------------------------------------------------------------------------------------------------------------
setMethod("addMessageHandler", "ChinookServer",

      function(self, messageName, functionToCall) {
         printf("ChinookServer::addMessageHandler: '%s'", messageName);
         self@dispatchMap[[messageName]] <- functionToCall
         }) # addMessageHandler

#------------------------------------------------------------------------------------------------------------------------
.setupWebSocketHandlers <- function(server, wsCon, browserFile)
{
   wsCon$open <- FALSE
   wsCon$ws <- NULL
   wsCon$result <- NULL

     # process http requests, handling queryString is 

   wsCon$call = function(req) {
      queryString <- req$QUERY_STRING
      if(nchar(queryString) > 0){
         fields <- ls(req)
         body <- chinookHttpQueryProcessor(server, queryString)
         return(list(status=200L, headers = list('Content-Type' = 'text/html'),
                     body=body))
         } # the request had a query string
      httpBody <- "hello from ChinookServer main port"
      if(!is.na(browserFile))
          httpBody <- c(file=browserFile)
      response <- list(status = 200L,
                       headers = list('Content-Type' = 'text/html'),
                       body = httpBody
                       )
      return(response)
      } # call

      #  whenever a websocket connection is opened
   wsCon$onWSOpen = function(ws) {   
      printf("---- wsCon$onWSOpen");
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
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
         dispatchMessage(server, ws, message);
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .setupWebSocketHandlers
#------------------------------------------------------------------------------------------------------------------------
dispatchMessage <- function(server, WS, msg)
{
  if(msg$cmd == "keepAlive")
     return()
  
  if(msg$cmd == "logEvent")   # not yet implemented.  todo
      return()
  
  printf("--- entering ChinookServer dispatchMessage, msg: ")
  print(msg)
    
  errorFunction <- function(cond){
    return.msg <- list()
    return.msg$cmd <- msg$callback
    return.msg$callback <- ""
    package.version <- sessionInfo()$otherPkgs$ChinookServer$Version
    printf("ChinookServer.R %s dispatchMessage detected error", package.version);
    return.msg$status <- "error";
    error.msg <- sprintf("ChinookServer (version %s) exception!  %s", package.version, cond);
    msg.as.text <- paste(as.character(msg), collapse=";  ")
    msg.full <- sprintf("%s. incoming msg: %s", error.msg, msg.as.text)
    printf("--- msg.full: %s", msg.full);
    return.msg$payload <- msg.full
    WS$send(toJSON(return.msg))
    }

  tryCatch({
    if(msg$cmd == "keepAlive"){
      return();
      }
    if(msg$status == "forBrowser"){
        printf("R sees message for browser");
        print(paste(as.character(msg), collapse=";  "))
        msg$status <- "request"
        print("sending to browser");
        WS$send(toJSON(msg))
        return();
        }
    stopifnot(msg$cmd %in% ls(server@dispatchMap));
    printf("====== Server.dispatchMessage: %s  [%s]", msg$cmd, format(Sys.time(), "%a %b %d %Y %X"));;
    function.name <- server@dispatchMap[[msg$cmd]]
    printf("    function.name: %s", function.name)
    success <- TRUE   
    stopifnot(!is.null(function.name))
    func <- get(function.name)
    stopifnot(!is.null(func))
    do.call(func, list(WS, msg))
    }, error=errorFunction)

} # dispatchMessage
#------------------------------------------------------------------------------------------------------------------------
setMethod("registerMessageHandlers", "ChinookServer",

  function (obj) {
     addMessageHandler(obj, "getRegisteredMessageNames", "ChinookServer.getMessageNames")
     addMessageHandler(obj, "getDatasetNames", "ChinookServer.getDatasetNames")
     addMessageHandler(obj, "getDataSetNames", "ChinookServer.getDatasetNames")
     })

#------------------------------------------------------------------------------------------------------------------------
setMethod("run", "ChinookServer",

  function(self) {
     printf("starting ChinookServer::run")
     wsID <- startServer("0.0.0.0", port(self),  self@wsServer)
     self@wsServer$wsID <- wsID

     aux <- self@state[["auxPortState"]]
     aux.port <- port(self) + 1
     aux$auxWsID <- startDaemonizedServer("0.0.0.0", aux.port,  aux)
     self@state[["auxPortState"]] <- aux
     printf("  started daemonized server on aux port %s", aux.port)

     printf("   starting main on port %s, service loop", port(self))
     
     while (TRUE) {
       service()
       Sys.sleep(0.001)
       }
     }) # run

#------------------------------------------------------------------------------------------------------------------------
setMethod("serverVersion", "ChinookServer",

  function(self){
     sessionInfo()$otherPkgs$ChinookServer$Version;
  }) # serverVersion

#------------------------------------------------------------------------------------------------------------------------
setMethod('close', 'ChinookServer',

  function (self) {
     stopServer(self@wsServer$wsID)
     })

#------------------------------------------------------------------------------------------------------------------------
setMethod("getAnalysisPackageNames", "ChinookServer",

  function(self) {
    self@analysisPackageNames
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod("getDatasetNames", "ChinookServer",

  function(self) {
    self@datasetNames
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod("getDatasetByName", "ChinookServer",

   function(self, datasetName){
      if(!datasetName %in% ls(self@state))
          return(NULL)
      chinookDataset <- self@state[[datasetName]]
      return(getDataset(chinookDataset))
      })

#------------------------------------------------------------------------------------------------------------------------
# some refactoring needed here.  this method on the class is not available (yet?) to
# wsDatasets.R, since the ChinookServer object is not visible here.  so this method is not
# called, not used.   see instead wsDatasets.specifyCurrentDataset
setMethod("setActiveDataSet",  "ChinookServer",

   function(self, dataSetName){
      if(!dataSetName %in% getDatasetNames(self)){
          msg <- sprintf("Dataset name '%s' not recognized. Choose from: %s", dataSetName,
                         paste(getDatasetNames(self), collapse=";"))
          warning(msg)
          return();
          }
     self@state[["currentDatasetName"]] <- dataSetName
     constructionNeeded <- !dataSetName %in% ls(self@state)
     printf("%s construction needed? %s", dataSetName, constructionNeeded);
     if(constructionNeeded){
         printf("ChinookServer.setActiveDataSet creating and storing a new %s object", dataSetName);
         eval(parse(text=sprintf("ds <- %s()", dataSetName)))
         } # creating and store new instance
      })

#------------------------------------------------------------------------------------------------------------------------
setMethod("getActiveDataSet",  "ChinookServer",

   function(self){
      self@state[["currentDatasetName"]]
      })

#------------------------------------------------------------------------------------------------------------------------
setMethod("port", "ChinookServer",

  function(self) {
    self@port
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod("getMessageNames", "ChinookServer",

    function(self){
      return(ls(self@dispatchMap))
    })

#------------------------------------------------------------------------------------------------------------------------
chinookHttpQueryProcessor <- function(server, queryString)
{
   printf("=== chinookHttpQueryProcessor")
   #print(queryString)
   #print(URLdecode(queryString))

   queryString <- URLdecode(queryString)
   diagnostic.string <- substr(queryString,1,10)
   printf("--- diagnostic.string: |%s|", diagnostic.string)
   jsonPrefixFound <- diagnostic.string == "?jsonMsg='";
   printf("--- matched? %s", jsonPrefixFound)
   
   if(jsonPrefixFound){
      rawJSON <- substr(queryString, 11, nchar(queryString)-1)  # drop enclosing single quotes
      msg <- fromJSON(URLdecode(rawJSON))
      #printf("calling dispatch on %s", msg$cmd);
      #print(msg$cmd)
      return(dispatchMessage(server, "http", msg))
      } # if jsonMsg queryString
   
   return("from the chinookHttpQueryProcessor");

} # chinookHttpQueryProcessor
#------------------------------------------------------------------------------------------------------------------------
AuxPort <- function(primaryWebSocketServer, port)
{
   aux.wsCon <- new.env(parent=emptyenv())
   aux.wsCon <- .setupAuxPortWebSocketHandlers(primaryWebSocketServer, aux.wsCon, port)
   # print(noquote(sprintf("ChinookServer/AuxPort , starting service loop on port %s", port)));
   # auxWsID <- startDaemonizedServer("0.0.0.0", port,  aux.wsCon)
   # printf ("leaving AuxPort, having started daemonized server on %s", port)
   # print(aux.wsCon)
   return(aux.wsCon)

} # AuxPort
#------------------------------------------------------------------------------------------------------------------------
.setupAuxPortWebSocketHandlers <- function(primaryWebSocketServer, wsCon, port)
{
   wsCon$open <- FALSE
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
       body = "hello from ChinookServer auxiliary port")
       }

      # called whenever a websocket connection is opened

   wsCon$onWSOpen = function(ws) {   
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
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
         dispatchMap <- local.state[["server"]]@dispatchMap
         if(cmd %in% ls(dispatchMap)){
           function.name <- dispatchMap[[msg$cmd]]
           printf("    function.name: %s", function.name)
           func <- get(function.name)
           do.call(func, list(primaryWebSocketServer$ws, msg))
           }
         else{         
            printf("ChinookSever/AuxPort onMessage, cmd: %s ", cmd);
            printf("sending to primaryWebSocketServer, fields %s", paste(ls(primaryWebSocketServer), collapse=","))
            primaryWebSocketServer$ws$send(toJSON(message))
            printf("after dispatch to primary");
            }
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .setupAuxPortWebSocketHandlers
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.getDatasetNames <- function(channel, msg)
{
   self <- local.state[["server"]]

   payload <- list(datasets=getDatasetNames(self))
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.getDatasetNames
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.getMessageNames <- function(channel, msg)
{
   self <- local.state[["server"]]

   payload <- ls(self@dispatchMap)
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.getMessageNames
#------------------------------------------------------------------------------------------------------------------------
