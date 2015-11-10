addRMessageHandler("getUserId", "getUserId");
addRMessageHandler("getDataSetNames", "getAllDataSetNames");
addRMessageHandler("getDataManifest", "getDataManifest");
addRMessageHandler("specifyCurrentDataset", "specifyCurrentDataset")
addRMessageHandler("getPatientHistoryTable", "getPatientHistoryTable")
addRMessageHandler("getPatientHistoryDxAndSurvivalMinMax", "getPatientHistoryDxAndSurvivalMinMax")
addRMessageHandler("getSampleDataFrame", "getSampleDataFrame")
addRMessageHandler("getGeneSetNames",    "wsGetGeneSetNames")
addRMessageHandler("getGeneSetGenes",    "wsGetGeneSetGenes")
addRMessageHandler("getSampleCategorizationNames", "wsGetSampleCategorizationNames")
addRMessageHandler("getSampleCategorization",      "wsGetSampleCategorization")
addRMessageHandler("getMarkersNetwork", "getMarkersAndSamplesNetwork")
addRMessageHandler("getPathway",        "getPathway")
addRMessageHandler("getDrugGeneInteractions", "getDrugGeneInteractions")
addRMessageHandler("canonicalizePatientIDsInDataset",    "canonicalizePatientIDsInDataset")

#----------------------------------------------------------------------------------------------------
# this file provides the standard oncoscape websocket json interface to SttrDataSet objects
# each of which is typically matrices of experimental data, a clinical history, and variaout
# annotations
# the datasests object is an environment containing dataset objects, specified to Oncoscape as dataset
# names whose packages are then dynmically require'd, whose constructor is then called, the resulting
# object stored by name in the environment
#
# these functions are tested by inst/wsJsonTests/test_datasets.py
#----------------------------------------------------------------------------------------------------
# some mysterious collision occurred with getUserID, so this is minimally renamed.
# i could not track down that symbol... (paul shannon, 14 mar 2015)
getUserId <- function(ws, msg)
{
  userID <- state[["userID"]];
 
  return.msg <- list(cmd=msg$callback, status="response", callback="", payload=userID)
  ws$send(toJSON(return.msg))

} # getUserId
#----------------------------------------------------------------------------------------------------
getAllDataSetNames <- function(ws, msg)
{
  names <- ls(datasets)
  printf("wsDatasets:getAllDataSetNames: %s", paste(names, collapse=", "))
  
  passwordSupplied <- !is.na(state[["password"]])
  payload <- list(datasets=names, passwordProtected=passwordSupplied)
  return.msg <- list(cmd=msg$callback, status="response", callback="", payload=payload)
  ws$send(toJSON(return.msg))

} # getAllDataSetNames
#----------------------------------------------------------------------------------------------------
specifyCurrentDataset <- function(ws, msg)
{
  available.datasets <- ls(datasets)
  printf("wsDatasets.R, specifyCurrentDataset, available: %s",
         paste(available.datasets, collapse=";"));
  
  dataset <- msg$payload

  stopifnot(dataset %in% available.datasets);
  state[["currentDatasetName"]] <- dataset;
  require(dataset, character.only=TRUE)

  constructionNeeded <- !dataset %in% ls(state)
  printf("%s construction needed? %s", dataset, constructionNeeded);
  if(constructionNeeded){
     printf("wsDatasets.specifyCurrentDataset creating and storing a new %s object", dataset);
     eval(parse(text=sprintf("ds <- %s()", dataset)))
     state[[dataset]] <- ds
     } # creating and storing new instance

  payload <- getDataManifestAsJSON(dataset)
  return.msg <- list(cmd=msg$callback, status="success", callback="",
                     payload=payload)
  
  ws$send(toJSON(return.msg))

} # specifyCurrentDataset
#----------------------------------------------------------------------------------------------------
# return the manifest in a 3-field "payload" form ready to send to any requesting client.
# the three fields: datasetName, colnamaes, matrix
getDataManifestAsJSON <-function(datasetName)
{
  tbl <- manifest(datasets[[datasetName]])

    # the first two columns, "variable" and "class" are not so relevant for the oncoscape display
  tbl <- tbl[, -c(1,2)]
    # make some column names more friendly
  column.titles <- colnames(tbl)
  column.titles <- sub("entity.count", "rows", column.titles)
  column.titles <- sub("feature.count", "cols", column.titles)
  column.titles <- sub("entity.", "row ", column.titles)
  column.titles <- sub("feature.", "column ", column.titles, fixed=TRUE)
  
  matrix <- as.matrix(tbl)
  colnames(matrix) <- NULL
    
  list(datasetName=datasetName, colnames=column.titles, rownames=rownames(tbl), mtx=matrix)

} # getDataManifestAsJSON
#----------------------------------------------------------------------------------------------------
getDataManifest <- function(ws, msg)
{
  datasetName <- msg$payload;

  if(!datasetName %in% ls(datasets)){
     return.msg <- list(cmd=msg$callback, status="error", callback="",
                        payload=sprintf("unknown dataset '%s'", datasetName))
     ws$send(toJSON(return.msg))
     return;
     }

  payload <- getDataManifestAsJSON(datasetName)
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # getDataManifest
#----------------------------------------------------------------------------------------------------
# a convenience method, one which does the standard lookup task needed by several client functions
# (for viewing the whole table, for using survival and status to plot kaplan-meier curves, ...)
# the reduction of > 100 columns to a useful set is managed here
.getPatientHistory <- function(datasetName, durationFormat="byDay")
{
  if(!datasetName %in% ls(datasets)){
     error.msg <- sprintf("wsDatasets.getPatientHistory failed to find '%s' in '%s'",
                  datasetName, paste(ls(datasets), collapse=","))
     stop(error.msg)
     }

  dataset <- datasets[[datasetName]]
  tbl.history <- getPatientTable(dataset)

  coi.raw <- c("ptID", "study", "Birth.gender", "Survival", "AgeDx", "TimeFirstProgression",
               "Status.status")
     # TODO: temporary hack:  these column names will soon be available from
     # TODO: the data package iteslf
     # x <- apply(tbl.events, 2, function(col) length(which(!is.na(col))))
     # names(which(x > 50))
  if(datasetName == "UWlung")
     coi.raw <- unique(c(coi.raw,
                       c("ptID", 
                         "Birth.date", "Birth.gender",
                         #"Drug.date1", 
                         # "ptNum", "study", "Status.tumorStatus"
                         #"Drug.date2", "Drug.therapyType", "Drug.agent", 
                         #"Drug.dose", "Drug.units", "Drug.route", 
                         #"Drug.cycle", "Drug.date1.2", "Drug.date2.2", 
                         #"Drug.therapyType.2", "Drug.agent.2", "Drug.dose.2", 
                         #"Drug.units.2", "Drug.route.2", "Drug.cycle.2", 
                         #"Drug.date1.3", "Drug.therapyType.3", "Drug.agent.3", 
                         #"Diagnosis.date", "Diagnosis.disease", "Diagnosis.siteCode", 
                         #"Status.date", "Status.status", "Progression.date", 
                         #"Progression.event", "Progression.number", "Procedure.date", 
                         #"Procedure.service", "Procedure.name", "Procedure.site", 
                         #"Procedure.side", "Procedure.date.2", "Procedure.service.2", 
                         #"Procedure.name.2", "Procedure.site.2", "Procedure.side.2", 
                         #"Encounter.type", "Encounter.date", "Encounter.systolic", 
                         #"Encounter.diastolic", "Encounter.type.2", "Encounter.date.2", 
                         #"Encounter.systolic.2", "Encounter.diastolic.2", "Encounter.type.3", 
                         #"Encounter.date.3", "Encounter.type.4", "Encounter.date.4", 
                         "Background.smoking.status",
                         #"Background.alcohol.amount",
                         "Survival", 
                         "AgeDx", "TimeFirstProgression")))


  coi <- intersect(coi.raw, colnames(tbl.history))
  printf("wsDatasets.getPatientHistory, %s, found %d coi", datasetName, length(coi))
  
  if(durationFormat == "byYear"){
     duration.columns <-  c("Survival", "AgeDx", "TimeFirstProgression")
     duration.column.indices <- match(duration.columns, colnames(tbl.history))
     deleters <- which(is.na(duration.column.indices))
     if(length(deleters) > 0)
        duration.column.indices <- duration.column.indices[-deleters]
   
     if(length(duration.column.indices) > 0){
        for(colNumber in duration.column.indices){
           tbl.history[, colNumber] <- round(1000 * tbl.history[, colNumber]/365.25)/1000
          } # for colNumber
        } # if length
     } # if "byYear"

  if(length(coi) < 3){
     emsg <- sprintf("wsDataset:getPateintHistoryTable: %d desired columns not found: %s",
                     length(coi), paste(coi.raw, collapse=" "))
     stop(emsg)
     }

  tbl.history[, coi]

} # .getPatientHistory
#----------------------------------------------------------------------------------------------------
getPatientHistoryTable <- function(ws, msg)
{
  #printf("wsDatasets.R::getPatientHistoryTable about to send '%s' cmd", msg$callback);

  datasetName <- state[["currentDatasetName"]]

  payload.field.names <- names(msg$payload)
  durationFormat <- "byDay"
  if("durationFormat" %in% payload.field.names)
     durationFormat <- msg$payload$durationFormat
      
  tbl.history <- .getPatientHistory(datasetName, durationFormat)

  printf("wsDatasets.getPatientHistoryTable, dim (%d, %d)", nrow(tbl.history), ncol(tbl.history))
  column.names <- colnames(tbl.history)
  mtx <- as.matrix(tbl.history)
  payload <- list(colnames=column.names, tbl=mtx)
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # getPatientHistoryTable
#----------------------------------------------------------------------------------------------------
# todo: column names as input paramenters in payload?
getPatientHistoryDxAndSurvivalMinMax <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  tbl.history <- .getPatientHistory(datasetName)

  stopifnot("AgeDx"   %in% colnames(tbl.history))
  stopifnot("Survival" %in% colnames(tbl.history))
  
  result <- list(ageAtDxLow=min(tbl.history$AgeDx,      na.rm=TRUE),
                 ageAtDxHigh=max(tbl.history$AgeDx,     na.rm=TRUE),
                 survivalLow=min(tbl.history$Survival,  na.rm=TRUE),
                 survivalHigh=max(tbl.history$Survival, na.rm=TRUE))

  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=result)
  ws$send(toJSON(return.msg))

} # getPatientHistoryDxAndSurvivalMinMax
#----------------------------------------------------------------------------------------------------
getSampleDataFrame <- function(ws, msg)
{
  tbl <- data.frame(integers=1:2, strings=c("ABC", "def"), floats=c(3.14, 2.718),
                    stringsAsFactors=FALSE)
  
  payload <- list(colnames=colnames(tbl), tbl=as.matrix(tbl))
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # getPatientHistoryTable
#----------------------------------------------------------------------------------------------------
wsGetGeneSetNames <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]

  payload <- getGeneSetNames(dataset)
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # wsGetGeneSetNames
#----------------------------------------------------------------------------------------------------
wsGetGeneSetGenes <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]
  geneSetName <- msg$payload
  stopifnot(geneSetName %in% getGeneSetNames(dataset))

  payload <- getGeneSetGenes(dataset, geneSetName)
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
  ws$send(toJSON(return.msg))

} # wsGetGeneSetGenes
#----------------------------------------------------------------------------------------------------
wsGetSampleCategorizationNames <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]

  payload <- getSampleCategorizationNames(dataset);
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # wsGetSampleCategorizationNames
#----------------------------------------------------------------------------------------------------
wsGetSampleCategorization <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]
  categorizationName <- msg$payload
  tbl <- getSampleCategorization(dataset, categorizationName)
  
  payload <- list(colnames=colnames(tbl), rownames=rownames(tbl), tbl=as.matrix(tbl))
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # wsGetSampleCategoriation
#----------------------------------------------------------------------------------------------------
getMarkersAndSamplesNetwork <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]
  markerName = "g.markers.json"

  if(markerName %in% names(networks(dataset))){
	  payload <- networks(dataset)[[markerName]]
	  printf("wsDatasets.getMarkersAndSamplesNetwork, size: %d", nchar(payload));
	  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
	  ws$send(toJSON(return.msg))
	  return;
  }
  printf("wsDatasets.getMarkersAndSamplesNetwork, %s not in %s", markerName, datasetName);
  payload <- paste("error: wsDatasets.getMarkersAndSamplesNetwork, ",markerName, " not in ", datasetName, sep="")
  return.msg <- list(cmd=msg$callback, status="error", callback="", payload=payload)
  ws$send(toJSON(return.msg))
  

} # getMarkersAndSamplesNetwork
#----------------------------------------------------------------------------------------------------
getPathway <- function(ws, msg)
{
  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]
  pathwayName <- msg$payload
  printf("available: %s", paste(names(networks(dataset)), collapse=", "));
  printf("wsDatasets.getPathway ASKED for pathway '%s'", pathwayName);
  if(pathwayName %in% names(networks(dataset))){
	  payload <- networks(dataset)[[pathwayName]];
	  printf("wsDatasets.getPathway, size: %d", nchar(payload));
	  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)
	  ws$send(toJSON(return.msg))
	  return;
  }
	  printf("wsDatasets.getPathway, %s not in %s", pathwayName, datasetName);
	  payload <- paste("error: wsDatasets.getPathway, ",pathwayName, " not in ", datasetName, sep="")
	  return.msg <- list(cmd=msg$callback, status="error", callback="", payload=payload)
  	  ws$send(toJSON(return.msg))
  

} # getPathway
#----------------------------------------------------------------------------------------------------
getDrugGeneInteractions <- function(ws, msg)
{
  genes <- msg$payload$genes

     # very quick hack for (24 jul 2015) demo
  if(!exists("tbl.dgi")){
     printf("-- wsDatasets.getDrugGeneInteractions about load from tbl.dgi.RData")
     file <- system.file(package="DGI", "extdata", "tbl.dgi.RData")
     load(file, envir=.GlobalEnv);
     }

  tbl.sub <- unique(subset(tbl.dgi, gene %in% genes))
  genes.out <- unique(tbl.sub[,1])
  printf("wsDataSets.getDrugGeneInteractions returning tbl with %d unique genes: %s",
         length(genes.out), paste(genes.out, collapse=", "));
         
  payload <- list(colnames=colnames(tbl.sub), tbl=as.matrix(tbl.sub))
  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

  ws$send(toJSON(return.msg))

} # getDrugGeneInteractions
#----------------------------------------------------------------------------------------------------
canonicalizePatientIDsInDataset <- function(ws, msg)
{

  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]

  printf("-- getPatientIDs from %s", datasetName)
  
  sampleIDs <- msg$payload
  printf("-- looking up %d IDs", length(sampleIDs))

  ptIDs <- canonicalizePatientIDs(dataset, sampleIDs)

  printf("-- found %d IDs", length(ptIDs))
 

  return.msg <- list(cmd=msg$callback, status="success", callback="", payload=ptIDs)

  ws$send(toJSON(return.msg))

} # getDataManifest
#----------------------------------------------------------------------------------------------------
