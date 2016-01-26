# OncoDev14: a refactored oncoscape, intended for dedicated R sessions per user, started
# out of a node.js "onco launcher" webapp
#---------------------------------------------------------------------------------------------------
.OncoDev15 <- setClass("OncoDev15",
         representation(datasetNames="character",
                        currentDatasetName="character")
         )

#---------------------------------------------------------------------------------------------------
setGeneric("exeCmd",            signature="self", function(self, rawMessage) standardGeneric("exeCmd"))
setGeneric("getDataSetNames",   signature="self", function(self) standardGeneric("getDataSetNames"))
setGeneric("setActiveDataSet",  signature="self", function(self, dataSetName) standardGeneric("setActiveDataSet"))
setGeneric("getActiveDataSet",  signature="self", function(self) standardGeneric("getActiveDataSet"))
#---------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
dispatchMap <- new.env(parent=emptyenv())
state <- new.env(parent=emptyenv())
datasets <- new.env(parent=emptyenv())
#---------------------------------------------------------------------------------------------------
# constructor
OncoDev15 = function(datasetNames)
{
   printf("OncoDev15 ctor, datasetNames: %s", paste(datasetNames, collapse=","))
   
   state[["userID"]] <- "19"
   state[["rawDatasetNames"]] <- datasetNames
   state[["currentDatasetName"]] <- NA_character_
   state[["password"]] <- NA_character_
   
   oncoscape <- .OncoDev15(datasetNames=datasetNames,
                           currentDatasetName=NA_character_)
   
   .loadDataPackages(datasetNames)
      
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
   printf("OncoDev15.loadDataPackages");
   datasetNames <- strsplit(datasetNames, ";")[[1]]
   for(datasetName in datasetNames){
     printf("OncoDev15:.loadDataPackages: %s", datasetName);
        eval(parse(text= sprintf("datasets[['%s']] <- SttrDataPackage()", datasetName)))
        message(sprintf("OncoDev15 loading: %s", datasetName))

#     s <- sprintf("require(%s, quietly=TRUE)", datasetName)
#     tryCatch(eval(parse(text=s)), error=function(e) {
#        message(sprintf("failed to load dataset '%s'", datasetName))
#        })
#     if(exists(datasetName)){
#        s <- sprintf("datasets[['%s']] <- %s(key=%s)", datasetName, datasetName, encryptedKey)
#        s <- sprintf("datasets[['%s']] <- %s()", datasetName, datasetName)
#        duration <- system.time(tryCatch(eval(parse(text=s)),
#                                error=function(e)
#                                message(sprintf("failure calling constructor for '%s'", datasetName))))[["elapsed"]]
#        message(sprintf("OncoDev14 loading: %40s %7.2f seconds", s, duration))
#        message(sprintf("  new list of loaded datasets: %s", paste(ls(datasets), collapse=",")))
#        } # if data package successfully loaded, ctor defined
     } # for datasetName

   printf("=== datsets now available in datasets environment: %s", paste(ls(datasets), collapse=","))
    
} # .loadDataPackages
#---------------------------------------------------------------------------------------------------
addRMessageHandler <- function(key, function.name)
{
   printf("OncoDev15 addRMessageHandler: '%s'", key);
   dispatchMap[[key]] <- function.name
    
} # addRMessageHandler
#---------------------------------------------------------------------------------------------------
setMethod("exeCmd",  "OncoDev15",
  function(self, rawMessage)
  {
     message <- as.list(jsonlite::fromJSON(rawMessage))
           #loginfo(message);
          
           if(!is(message, "list")){
              message("message: new websocket message is not a list");
              return;
              }
           if (! "cmd" %in% names(message)){
              message("error: new websocket messages has no 'cmd' field");
              return;
              }
           cmd <- message$cmd
           dispatchMessage(message);

  })
#---------------------------------------------------------------------------------------------------
dispatchMessage <- function(msg)
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
    toJSON(return.msg)
    }

  tryCatch({
    if(msg$cmd == "keepAlive"){
      #printf("--- keepAlive: %s", date())
      return();
      }
    if(msg$status == "forBrowser"){
        printf("R sees message for browser");
        print(paste(as.character(msg), collapse=";  "))
        msg$status <- "request"
        print("sending to browser");
        toJSON(msg)
        return();
        }
    stopifnot(msg$cmd %in% ls(dispatchMap));
    printf("====== Oncoscape.dispatchMessage: %s  [%s]", msg$cmd, format(Sys.time(), "%a %b %d %Y %X"));;
    function.name <- dispatchMap[[msg$cmd]]
    success <- TRUE   
    stopifnot(!is.null(function.name))
    func <- get(function.name)
    stopifnot(!is.null(func))
    do.call(func, list(msg))
    }, error=errorFunction)

} # dispatchMessage

#----------------------------------------------------------------------------------------------------
setMethod("getDataSetNames", "OncoDev15",

  function(self) {
    self@datasetNames
    }) # getDataSetNames

#---------------------------------------------------------------------------------------------------
# some refactoring needed here.  this method on the class is not available (yet?) to
# wsDatasets.R, since the OncoDev14 object is not visible here.  so this method is not
# called, not used.   see instead wsDatasets.specifyCurrentDataset
setMethod("setActiveDataSet",  "OncoDev15",

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
setMethod("getActiveDataSet",  "OncoDev15",
   function(self){
      state[["currentDatasetName"]]
      })
#---------------------------------------------------------------------------------------------------
