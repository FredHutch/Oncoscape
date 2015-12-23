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
# constructor
ChinookDataset <- function(name="", dataset=NA)
{
   state <- new.env(parent=emptyenv())
   if(!is.na(dataset))
       stopifnot("SttrDataPackage" %in% is(dataset))
   
   state[["dataset"]] <- dataset

   .ChinookDataset(name=name, state=state)

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
