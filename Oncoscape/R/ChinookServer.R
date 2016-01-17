# ChinookServer: a refactored oncoscape, intended for one dedicated R session per user
#------------------------------------------------------------------------------------------------------------------------
.ChinookServer <- setClass("ChinookServer",
         representation(wsServer="environment",
                        port="integer",
                        browserFile="character",
                        userCredentials="character",
                        datasetNames="character",
                        analysisPackageNames="character",
                        state="environment",
                        dispatchMap="environment")
         )

#------------------------------------------------------------------------------------------------------------------------
setGeneric("run",                     signature="self", function(self) standardGeneric("run"))
setGeneric("port",                    signature="self", function(self) standardGeneric("port"))
setGeneric("getAnalysisPackageNames", signature="self", function(self) standardGeneric("getAnalysisPackageNames"))
setGeneric("getDatasetNames",         signature="self", function(self) standardGeneric("getDatasetNames"))
setGeneric("getDatasetByName",        signature="self", function(self, datasetName) standardGeneric("getDatasetByName"))
setGeneric('close',                   signature="self", function(self) standardGeneric("close"))
setGeneric("serverVersion",           signature="self", function(self) standardGeneric("serverVersion"))
setGeneric("addMessageHandler",       signature="self", function(self, messageName, functionToCall) standardGeneric("addMessageHandler"))
setGeneric("getMessageNames",         signature="self", function(self) standardGeneric("getMessageNames"))
setGeneric('registerMessageHandlers', signature='obj', function (obj) standardGeneric ('registerMessageHandlers'))
#------------------------------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#------------------------------------------------------------------------------------------------------------------------
# web socket protocols require that simple functions be used for configuation, but some object
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

   dispatchMap <- new.env(parent=emptyenv())
   wsCon <- new.env(parent=emptyenv())
   
   server <- .ChinookServer(wsServer=wsCon,
                            port=as.integer(port),
                            browserFile=browserFile,
                            userCredentials=userCredentials,
                            datasetNames=datasetNames,
                            analysisPackageNames=analysisPackageNames,
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
      printf("call (%d), queryString: ", nchar(queryString), queryString)
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
         #printf("===* calling dispatchMessage from main port ws$onMessage")
         #dispatchMessage(server, ws, message);
         dispatchMessage(ws, message);
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .setupWebSocketHandlers
#------------------------------------------------------------------------------------------------------------------------
dispatchMessage <- function(WS, msg)
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
        printf("class of msg: %s", class(msg))
        print(msg)
        msg$status <- "request"
        primaryWebSocketServer <- local.state[["server"]]@wsServer
        printf("sending to browser, class of WS is %s", class(primaryWebSocketServer$ws));
        primaryWebSocketServer$ws$send(toJSON(msg))
        printf("after primaryWebSocketServer$ws$send");
        # WS$send(toJSON(msg))
        result <- toJSON(list(cmd=msg$callback, status="success", callback="", payload="sent to browser"))
        return(result);
        }

    server <- local.state[["server"]]
    
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
     addMessageHandler(obj, "setVariable",               "ChinookServer.setVariable")
     addMessageHandler(obj, "getVariableNames",          "ChinookServer.getVariableNames")
     addMessageHandler(obj, "getVariable",               "ChinookServer.getVariable")
     addMessageHandler(obj, "deleteVariable",            "ChinookServer.deleteVariable")
     addMessageHandler(obj, "specifyCurrentDataset",     "ChinookServer.specifyCurrentDataset")
     addMessageHandler(obj, "getDatasetNames",           "ChinookServer.getDatasetNames")
     addMessageHandler(obj, "getDatasetNames",           "ChinookServer.getDatasetNames")
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
      printf("ChinookServer::getDatasetByName, ls(state): %s", paste(ls(self@state), collapse=","))
      if(!datasetName %in% ls(self@state))
          return(NULL)
      chinookDataset <- self@state[[datasetName]]
      return(getDataset(chinookDataset))
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
   print(queryString)
   print(URLdecode(queryString))

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
      server <- local.state[["server"]]
      printf("===* calling dispatchMessage from chinookHttpQueryProcessor")
      #printf("    server:")
      #print(server)
      result <- dispatchMessage("http", msg)
      printf("chinookHttpQueryProcessor, after dispatchMessage, result: %s", result);
      return(result)
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
      queryString <- req$QUERY_STRING
      printf("call (%d), aux queryString: ", nchar(queryString), queryString)
      if(nchar(queryString) > 0){
         fields <- ls(req)
         body <- chinookHttpQueryProcessor(primaryWebSocketServer, queryString)
         return(list(status=200L, headers = list('Content-Type' = 'text/html'),
                     body=body))
         } # the request had a query string
      httpBody <- "hello from ChinookServer auxiliary port"
      response <- list(status = 200L,
                       headers = list('Content-Type' = 'text/html'),
                       body = httpBody
                       )
      return(response)
      } # call

   wsCon$onWSOpen = function(ws) {   
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         printf("new ws message on AUX port: ")
         message <- as.list(fromJSON(rawMessage))
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
         dispatchMap <- local.state[["server"]]@dispatchMap
         printf(" about to dispatch from aux handler: %s (in map? %s)", cmd, cmd %in% ls(dispatchMap))
         if(cmd %in% ls(dispatchMap)){
           function.name <- dispatchMap[[cmd]]
           printf("    function.name: %s", function.name)
           func <- get(function.name)
           do.call(func, list(wsCon$ws, message))
           }
         else{         
            printf("ChinookSever/AuxPort onMessage, cmd: %s ", cmd);
            printf("sending to primaryWebSocketServer, fields %s", paste(ls(primaryWebSocketServer), collapse=","))
            primaryWebSocketServer$ws$send(toJSON(message))
            #primaryWebSocketServer$ws$send(toJSON(message))
            printf("after dispatch to primary");
            }
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .setupAuxPortWebSocketHandlers
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.setVariable <- function(channel, msg)
{
   variable <- msg$payload$name
   value <- msg$payload$value

   if(variable != "server")
       local.state[[variable]] <- value

   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=""))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.setVariable
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.getVariableNames <- function(channel, msg)
{
   payload <- sort(ls(local.state))

   if("server" %in% payload)   # protect the server variable from being seen, from being manipulated
       payload <- payload[-which(payload=="server")]

   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.getVariableNames
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.getVariable <- function(channel, msg)
{
   variable <- msg$payload$name
   value <- local.state[[variable]]
   payload <- list(name=variable, value=value)
   
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.getVariable
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.deleteVariable <- function(channel, msg)
{
   variable <- msg$payload$name

   status <- "error"   # be pessimistic

   if(variable != "server" && variable %in% ls(local.state)){
      rm(list=variable, envir=local.state)
      status <- "success"
      }
   
   response <- toJSON(list(cmd=msg$callback, status=status, callback="", payload=""))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.getVariable
#------------------------------------------------------------------------------------------------------------------------
# a client has selected a dataset name, and tells us that they have done so.  Our convention is that
#
#  1) we here set the selected dataset as our default, load and instantiate it if needed 
#  2) issue the callback message provided by the client
#  3) depending explicitly on consistency among the current set of clients (i.e., various javascript modules
#     each running in their own jQuery tab in a web browser), we may have many such callbacks to issue.
#  4) this is how we handle notification of these separate clients that, until further notice, there is a new
#     current datset, and they may want to respond appropriately
#  5) that appropriate response could be:  give me the markers (genes & samples) network for this new dataset,
#     or give me the mRNA expression data so that I can calculate a default PCA
#
ChinookServer.specifyCurrentDataset <- function(channel, msg)
{
   printf("=== ChinookServer.specifyCurrentDataset")
   self <- local.state[["server"]]
   newDatasetName <- msg$payload
   stopifnot(newDatasetName %in% getDatasetNames(self))
   # setActiveDataset(self, newDatasetName);
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=newDatasetName))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # ChinookServer.specifyCurrentDataset
#------------------------------------------------------------------------------------------------------------------------
ChinookServer.getDatasetNames <- function(channel, msg)
{
   printf("=== ChinookServer.getDatasetNames")
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
   printf("=== ChinookServer.getMessageNames")
   self <- local.state[["server"]]

   payload <- ls(self@dispatchMap)
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   printf("--- response");
   print(response)
   printf("--- channel")
   print(channel)
   printf("channel type? %s", paste(is(channel), collapse=","))
   return(.send(channel, response))

} # ChinookServer.getMessageNames
#------------------------------------------------------------------------------------------------------------------------
.send <- function(channel, response)
{
   if("WebSocket" %in% is(channel))
      invisible(channel$send(response))
   else
      return(response)

} # .send
#------------------------------------------------------------------------------------------------------------------------
