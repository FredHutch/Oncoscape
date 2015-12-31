#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.ChinookDataset <- setClass ("ChinookDataset", 
                         representation = representation(
                                            name="character",
                                            state="environment"
                                            )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('getName',          signature='obj', function (obj) standardGeneric ('getName'))
setGeneric('setServer',        signature='obj', function (obj, server) standardGeneric ('setServer'))
setGeneric('getServer',        signature='obj', function (obj, server) standardGeneric ('getServer'))
setGeneric('getDataset',       signature='obj', function (obj) standardGeneric ('getDataset'))
setGeneric('registerMessageHandlers', signature='obj', function (obj) standardGeneric ('registerMessageHandlers'))
#----------------------------------------------------------------------------------------------------
# only functions - not methods - can be dispatched to in a web socket handler.
# since these functions sometimes need information and operations which properly belong
# to instances of the class specified here, we create (and seal within this package) 
# the "local.state" environment, so that called-back functions have access to all that they need
local.state <- new.env(parent=emptyenv())
#----------------------------------------------------------------------------------------------------
# constructor
ChinookDataset <- function(name="", dataset=NULL)
{
   state <- new.env(parent=emptyenv())

   if(!is.null(dataset))
       stopifnot("Dataset" %in% is(dataset))
   
   state[["dataset"]] <- dataset

   obj <- .ChinookDataset(name=name, state=state)
   #printf("class of newly created ChinookDatset object for datset '%s': %s", name, paste(is(obj), collapse=","))
   local.state[["self"]] <- obj

   obj

} # ChinookDataset
#----------------------------------------------------------------------------------------------------
setMethod("getDataset", "ChinookDataset",

  function (obj) {
     if("dataset" %in% ls(obj@state))
         return(obj@state[["dataset"]])
     else
         return(NA)
     })

#----------------------------------------------------------------------------------------------------
setMethod("setServer", "ChinookDataset",

  function (obj, server) {
     obj@state[["server"]] <- server
     })

#----------------------------------------------------------------------------------------------------
setMethod("getServer", "ChinookDataset",

  function (obj) {
     if("server" %in% ls(obj@state))
         return(obj@state[["server"]])
     else
         return(NA)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getName", "ChinookDataset",

  function (obj) {
     return(obj@name)
     })

#----------------------------------------------------------------------------------------------------
setMethod("registerMessageHandlers", "ChinookDataset",

  function (obj) {
     addMessageHandler(getServer(obj), "getDatasetManifest", "Dataset.getManifest")
     addMessageHandler(getServer(obj), "getDatasetDataFrame", "Dataset.getDataFrame")
     addMessageHandler(getServer(obj), "getDatasetJSON", "Dataset.getJSON")
     })

#----------------------------------------------------------------------------------------------------
Dataset.getManifest <- function(channel, msg)
{
   self <- local.state[["self"]]
   contained.dataset <- getDataset(self)

   tbl <- manifest(contained.dataset)
   datasetName <- getName(self)
   payload <- .dataframeToJSON(datasetName, tbl)
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getManifest
#----------------------------------------------------------------------------------------------------
.dataframeToJSON <-function(datasetName, tbl)
{
    # the first two columns, "variable" and "class" are not so relevant for the oncoscape display
  variable.names <- tbl[,1]
  #tbl <- tbl[, -c(1,2)]

    # make some column names more friendly
  column.titles <- colnames(tbl)
  column.titles <- sub("entity.count", "rows", column.titles)
  column.titles <- sub("feature.count", "cols", column.titles)
  column.titles <- sub("entity.", "row ", column.titles)
  column.titles <- sub("feature.", "column ", column.titles, fixed=TRUE)
  matrix <- as.matrix(tbl)
  colnames(matrix) <- NULL
    
  list(datasetName=datasetName, variables=variable.names, colnames=column.titles,
       rownames=rownames(tbl), mtx=matrix)

} # .dataframeToJSON
#----------------------------------------------------------------------------------------------------
Dataset.getDataFrame <- function(channel, msg)
{
   self <- local.state[["self"]]
   contained.dataset <- getDataset(self)
   name <- msg$payload
   stopifnot(name %in% names(data.frames(contained.dataset)))
   tbl <- data.frames(contained.dataset)[[name]]
   datasetName <- getName(self)
   payload <- .dataframeToJSON(datasetName, tbl)
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getDataFrame
#----------------------------------------------------------------------------------------------------
Dataset.getJSON <- function(channel, msg)
{
   self <- local.state[["self"]]
   contained.dataset <- getDataset(self)
   name <- msg$payload
   #printf("ChinookDataset, about to get JSON object with name %s", name)
   json.obj <- getJSON(contained.dataset, name)
   #printf("  class of object: %s", class(json.obj))
   #print(json.obj)

   stopifnot(!is.na(json.obj))
   stopifnot(class(json.obj) == "json")
   
   payload <- json.obj
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getJSON
#----------------------------------------------------------------------------------------------------
# addRMessageHandler("getDataManifest", "getDataManifest");
# addRMessageHandler("getPatientHistoryTable", "getPatientHistoryTable")
# addRMessageHandler("getPatientHistoryDxAndSurvivalMinMax", "getPatientHistoryDxAndSurvivalMinMax")
# addRMessageHandler("getGeneSetNames",    "wsGetGeneSetNames")
# addRMessageHandler("getGeneSetGenes",    "wsGetGeneSetGenes")
# addRMessageHandler("getSampleCategorizationNames", "wsGetSampleCategorizationNames")
# addRMessageHandler("getSampleCategorization",      "wsGetSampleCategorization")
# addRMessageHandler("getMarkersNetwork", "getMarkersAndSamplesNetwork")
# addRMessageHandler("getPathway",        "getPathway")
# addRMessageHandler("getDrugGeneInteractions", "getDrugGeneInteractions")
# addRMessageHandler("canonicalizePatientIDsInDataset",    "canonicalizePatientIDsInDataset")
