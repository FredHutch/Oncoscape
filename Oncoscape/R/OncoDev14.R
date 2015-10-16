# OncoDev14: a refactored oncoscape, intended for dedicated R sessions per user, started
# out of a node.js "onco launcher" webapp
#---------------------------------------------------------------------------------------------------
.OncoDev14 <- setClass("OncoDev14",
         representation(wsServer="environment",
                        port="integer",
                        scriptDir="character",
                        userID="character",
                        datasetNames="character",
                        currentDatasetName="character")
         )

#---------------------------------------------------------------------------------------------------
setGeneric("run",               signature="self", function(self) standardGeneric("run"))
setGeneric("port",              signature="self", function(self) standardGeneric("port"))
setGeneric("getDataSetNames",   signature="self", function(self) standardGeneric("getDataSetNames"))
setGeneric("setActiveDataSet",  signature="self", function(self, dataSetName) standardGeneric("setActiveDataSet"))
setGeneric("getActiveDataSet",  signature="self", function(self) standardGeneric("getActiveDataSet"))
setGeneric('close',             signature="self", function(self) standardGeneric("close"))
setGeneric("serverVersion",     signature="self", function(self) standardGeneric("serverVersion"))
#---------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
dispatchMap <- new.env(parent=emptyenv())
state <- new.env(parent=emptyenv())
datasets <- new.env(parent=emptyenv())
#---------------------------------------------------------------------------------------------------
# constructor
OncoDev14 = function(port, scriptDir, userID, datasetNames, password=NA_character_)
{
   printf("OncoDev14 ctor, datasetNames: %s", paste(datasetNames, collapse=","))
   
   state[["userID"]] <- userID
   state[["rawDatasetNames"]] <- datasetNames
   state[["currentDatasetName"]] <- NA_character_
   state[["password"]] <- password

   wsCon <- new.env(parent=emptyenv())
   
   oncoscape <- .OncoDev14(wsServer=wsCon,
                           port=as.integer(port),
                           scriptDir=scriptDir,
                           userID=userID,
                           datasetNames=datasetNames,
                           currentDatasetName=NA_character_)
   
   .loadDataPackages(datasetNames)

   if(is.na(scriptDir))
      browserFile <- system.file(package="OncoDev14", "scripts", "default.html")
   else
      browserFile <- system.file(package="OncoDev14", "scripts", scriptDir, "index.html")
   stopifnot(file.exists(browserFile))

   wsCon <- .setupWebSocketHandlers(wsCon, browserFile)
   oncoscape@wsServer <- wsCon

      
   oncoscape

} # ctor
#---------------------------------------------------------------------------------------------------
# the semanitcs of toJSON changed between RJSONIO and jsonlite: in the latter, scalars are
# promoted to arrays of length 1.  rather than change our javascript code, and since such
# promotion -- while sensible in the context of R -- strikes me as gratuitous, I follow
# jeroen ooms suggestion, creating this wrapper
toJSON <- function(..., auto_unbox = TRUE)
{
  jsonlite::toJSON(..., auto_unbox = auto_unbox)
}
#----------------------------------------------------------------------------------------------------
.loadDataPackages <- function(datasetNames)
{
   printf("OncoDev14.loadDataPackages");
   datasetNames <- strsplit(datasetNames, ";")[[1]]
   for(datasetName in datasetNames){
     printf("OncoDev14:.loadDataPackages: %s", datasetName);
     s <- sprintf("require(%s, quietly=TRUE)", datasetName)
     tryCatch(eval(parse(text=s)), error=function(e) {
        message(sprintf("failed to load dataset '%s'", datasetName))
        })
     if(exists(datasetName)){
#        s <- sprintf("datasets[['%s']] <- %s(key=%s)", datasetName, datasetName, encryptedKey)
        s <- sprintf("datasets[['%s']] <- %s()", datasetName, datasetName)
        duration <- system.time(tryCatch(eval(parse(text=s)),
                                error=function(e)
                                message(sprintf("failure calling constructor for '%s'", datasetName))))[["elapsed"]]
        message(sprintf("OncoDev14 loading: %40s %7.2f seconds", s, duration))
        message(sprintf("  new list of loaded datasets: %s", paste(ls(datasets), collapse=",")))
        } # if data package successfully loaded, ctor defined
     } # for datasetName

   printf("=== datsets now available in datasets environment: %s", paste(ls(datasets), collapse=","))
    
} # .loadDataPackages
#---------------------------------------------------------------------------------------------------
addRMessageHandler <- function(key, function.name)
{
   printf("OncoDev14 addRMessageHandler: '%s'", key);
   dispatchMap[[key]] <- function.name
    
} # addRMessageHandler
#---------------------------------------------------------------------------------------------------
.setupWebSocketHandlers <- function(wsCon, browserFile)
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
       body = c(file=browserFile))
       }

      # called whenever a websocket connection is opened
   wsCon$onWSOpen = function(ws) {   
      #printf("---- wsCon$onWSOpen");
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
         #loginfo(message);
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
         #printf("OncoDev14:onMessage, raw ");
         #print(rawMessage)
         #printf("OncoDev14:onMessage, cooked ");
         #print(message)
         dispatchMessage(ws, message);
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .setupWebSocketHandlers
#--------------------------------------------------------------------------------
dispatchMessage <- function(WS, msg)
{
  errorFunction <- function(cond){
    return.msg <- list()
    return.msg$cmd <- msg$callback
    return.msg$callback <- ""
    package.version <- sessionInfo()$otherPkgs$OncoDev14$Version
    printf("OncoDev14.R %s dispatchMessage detected error", package.version);
    return.msg$status <- "error";
    error.msg <- sprintf("OncoDev14 (version %s) exception!  %s", package.version, cond);
    msg.as.text <- paste(as.character(msg), collapse=";  ")
    msg.full <- sprintf("%s. incoming msg: %s", error.msg, msg.as.text)
    printf("--- msg.full: %s", msg.full);
    return.msg$payload <- msg.full
    WS$send(toJSON(return.msg))
    }

  tryCatch({
    if(msg$cmd == "keepAlive"){
      #printf("--- keepAlive: %s", date())
      return();
      }
    stopifnot(msg$cmd %in% ls(dispatchMap));
    printf("====== Oncoscape.dispatchMessage: %s  [%s]", msg$cmd, format(Sys.time(), "%a %b %d %Y %X"));;
    function.name <- dispatchMap[[msg$cmd]]
    success <- TRUE   
    stopifnot(!is.null(function.name))
    func <- get(function.name)
    stopifnot(!is.null(func))
    do.call(func, list(WS, msg))
    }, error=errorFunction)

} # dispatchMessage
#---------------------------------------------------------------------------------------------------
setMethod("run", "OncoDev14",

  function(self) {
     print(noquote(sprintf("OncoDev14::run, starting service loop on port %d", port(self))))

     wsID <- startServer("0.0.0.0", port(self),  self@wsServer)
     self@wsServer$wsID <- wsID

 #    print(noquote(sprintf("OncoDev14::run, starting service loop on port %d", port(self))))
     while (TRUE) {
       service()
       Sys.sleep(0.001)
       }
     }) # run

#---------------------------------------------------------------------------------------------------
setMethod("serverVersion", "OncoDev14",

  function(self){
     sessionInfo()$otherPkgs$OncoDev14$Version;
  }) # serverVersion

#---------------------------------------------------------------------------------------------------
setMethod('close', 'OncoDev14',

  function (self) {
     stopServer(self@wsServer$wsID)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getDataSetNames", "OncoDev14",

  function(self) {
    self@datasetNames
    }) # getDataSetNames

#---------------------------------------------------------------------------------------------------
# some refactoring needed here.  this method on the class is not available (yet?) to
# wsDatasets.R, since the OncoDev14 object is not visible here.  so this method is not
# called, not used.   see instead wsDatasets.specifyCurrentDataset
setMethod("setActiveDataSet",  "OncoDev14",

   function(self, dataSetName){
      if(!dataSetName %in% getDataSetNames(self)){
          msg <- sprintf("Dataset name '%s' not recognized. Choose from: %s", dataSetName,
                         paste(getDataSetNames(self), collapse=";"))
          warning(msg)
          return();
          }
     state[["currentDatasetName"]] <- dataSetName
     constructionNeeded <- !dataSetName %in% ls(state)
     printf("%s construction needed? %s", dataSetName, constructionNeeded);
     if(constructionNeeded){
         printf("OncoDev14.setActiveDataSet creating and storing a new %s object", dataSetName);
         eval(parse(text=sprintf("ds <- %s()", dataSetName)))
         } # creating and store new instance
      })

#---------------------------------------------------------------------------------------------------
setMethod("getActiveDataSet",  "OncoDev14",
   function(self){
      state[["currentDatasetName"]]
      })
#---------------------------------------------------------------------------------------------------
setMethod("port", "OncoDev14",

  function(self) {
    self@port
    }) # port

#---------------------------------------------------------------------------------------------------
