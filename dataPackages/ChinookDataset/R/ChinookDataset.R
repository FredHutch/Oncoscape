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
       stopifnot("SttrDataPackageClass" %in% is(dataset))
   
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
     })

#----------------------------------------------------------------------------------------------------
Dataset.getManifest <- function(channel, msg)
{
   #printf("ChinookDataset::Dataset.getManifest")
   self <- local.state[["self"]]
   #printf("local.state[['self']]:")
   #print(is(self))
   contained.dataset <- getDataset(self)
   #printf("contained.dataset")
   #print(is(contained.dataset))

   tbl <- manifest(contained.dataset)
   #printf("--- tbl")
   #print(tbl)
   datasetName <- getName(self)
   #printf("--- datasetName: %s", datasetName);
   payload <- getDataManifestAsJSON(datasetName, tbl)
   #print(names(payload))
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   #print(is(channel))
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getManifest
#----------------------------------------------------------------------------------------------------
getDataManifestAsJSON <-function(datasetName, tbl)
{
    # the first two columns, "variable" and "class" are not so relevant for the oncoscape display
  #print(0)
  tbl <- tbl[, -c(1,2)]
    # make some column names more friendly
  #print(1)
  column.titles <- colnames(tbl)
  #print(2)
  column.titles <- sub("entity.count", "rows", column.titles)
  #print(3)
  column.titles <- sub("feature.count", "cols", column.titles)
  #print(4)
  column.titles <- sub("entity.", "row ", column.titles)
  #print(5)
  column.titles <- sub("feature.", "column ", column.titles, fixed=TRUE)
  #print(6)
  
  matrix <- as.matrix(tbl)
  #print(7)
  colnames(matrix) <- NULL
  #print(8)
    
  list(datasetName=datasetName, colnames=column.titles, rownames=rownames(tbl), mtx=matrix)

} # getDataManifestAsJSON
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
