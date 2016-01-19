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
setGeneric('getName',          signature='obj', function(obj) standardGeneric('getName'))
setGeneric('setServer',        signature='obj', function(obj, server) standardGeneric('setServer'))
setGeneric('getServer',        signature='obj', function(obj, server) standardGeneric('getServer'))
setGeneric('getDataset',       signature='obj', function(obj) standardGeneric('getDataset'))
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
     addMessageHandler(getServer(obj), "getDatasetManifest",          "Dataset.getManifest")
     addMessageHandler(getServer(obj), "getDataManifest",             "Dataset.getManifest")
     #addMessageHandler(getServer(obj), "getDatasetDataFrame",         "Dataset.getDataFrame")
     #addMessageHandler(getServer(obj), "getDatasetJSON",              "Dataset.getJSON")
     addMessageHandler(getServer(obj), "getDatasetItemNames",         "Dataset.getItemNames")
     addMessageHandler(getServer(obj), "getDatasetItemsByName",       "Dataset.getItemsByName")
     addMessageHandler(getServer(obj), "getDatasetItemSubsetByName",  "Dataset.getItemSubsetByName")
     addMessageHandler(getServer(obj), "getSubjectHistoryTable",      "Dataset.getSubjectHistoryTable")
     #addMessageHandler(getServer(obj), "getNetwork",                  "Dataset.getNetwork")             
     addMessageHandler(getServer(obj), "getMatrixNamesByCategory",    "Dataset.getMatrixNamesByCategory") 
     addMessageHandler(getServer(obj), "getSampleColors",             "Dataset.getSampleColors") 
     printf("registered messages: %s", paste(getMessageNames(getServer(obj)), collapse=","))
     })

#----------------------------------------------------------------------------------------------------
Dataset.getManifest <- function(channel, msg)
{
   datasetName <- msg$payload$dataset;
    
   self <- local.state[["self"]]
   server <- getServer(self)
   dataset <- getDatasetByName(server, datasetName)
   tbl <- getManifest(dataset)

   payload <- .prepDataframeOrMatrixForJSON(datasetName, tbl)
   column.titles <- payload$colnames   
     # make some column names more friendly
    column.titles <- sub("entity.count", "rows", column.titles)
    column.titles <- sub("feature.count", "cols", column.titles)
    column.titles <- sub("entity.", "row ", column.titles)
    column.titles <- sub("feature.", "column ", column.titles, fixed=TRUE)
  
   payload$colnames <- column.titles
   
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   #printf("ChinookDataset.getManifest about to return this json:")
   #print(response)
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getManifest
#----------------------------------------------------------------------------------------------------
Dataset.getSampleColors <- function(channel, msg)
{
   #printf("======== entering Dataset.getSampleColors")
   self <- local.state[["self"]]
   server <- getServer(self)

   datasetName <- msg$payload$dataset;

     # the stem of shared name, eg "glioma8" from the pca ui "color by..." menu
     # where the actual groups include (among others)
     #  "glioma8.nonCIMP.wtNRAS.mutTP53"
     #  "glioma8.nonCIMP.wtNRAS.wtTP53"

   target.group <- msg$payload$groupName;   
   ids <- msg$payload$samples;
   
   dataset <- getDatasetByName(server, datasetName)
   subjectIDs <- sampleIdToSubjectId(dataset, ids);
      # create a map from subjectIDs back to the incoming (possibly different sample) ids
   id.map <- ids
   names(id.map) <- subjectIDs
   tumorGroups <- getItem(dataset, "tumorGroups")
   tbl.viz <- getItem(dataset, "tbl.groupVizProps")
   groupsDB <- Groups()
   color.list <- createColorList(groupsDB, subjectIDs, target.group, tbl.viz)
      # restore the original ids, which may have been mapped (above) from
      # sample ids (as in TCGAbrain) to subject ids.
   names(color.list) <- as.character(id.map[names(color.list)])
   color.legend <- createColorLegend(groupsDB, target.group, tbl.viz)
   payload <- list(colors=color.list, legend=color.legend)
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   .send(channel, response)
    
} # Dataset.getSampleColors
#----------------------------------------------------------------------------------------------------
Dataset.getMatrixNamesByCategory <- function(channel, msg)
{
   requested.dataset <- msg$payload$datasetName
   category.string <- msg$payload$category
   self <- local.state[["self"]]
   server <- getServer(self)
   dataset <- getDatasetByName(server, requested.dataset)
   datasetName <- getName(dataset)
   #printf(" 330, datasetName, requested: %s   loaded 1: %s", requested.dataset, datasetName)
   stopifnot(requested.dataset == datasetName)

   tbl <- getManifest(dataset)
   indices <- grep(category.string, tbl$category, ignore.case=TRUE)
   names <- tbl[indices, "variable"]
   #printf("   matrixNames by category: %s", paste(names, collapse=","))
   payload <- list(datasetName=datasetName, expressionMatrixNames=names);
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   
   .send(channel, response)

} # Dataset.getMatrixNamesByCategory
#----------------------------------------------------------------------------------------------------
.prepDataframeOrMatrixForJSON <-function(datasetName, tbl)
{
    # the first two columns, "variable" and "class" are not so relevant for the oncoscape display
  variable.names <- tbl[,1]
  #tbl <- tbl[, -c(1,2)]

  column.titles <- colnames(tbl)

  matrix <- as.matrix(tbl)
  colnames(matrix) <- NULL
    
  result <- list(datasetName=datasetName, variables=variable.names, colnames=column.titles,
                 rownames=rownames(tbl), mtx=matrix)

  #printf("-------- leaving .prepDataframeOrMatrixForJSON")
  #print(result)

  result

} # .prepDataframeOrMatrixForJSON
#----------------------------------------------------------------------------------------------------
Dataset.getDataFrame <- function(channel, msg)
{
   self <- local.state[["self"]]
   dataset <- getDataset(self)
   name <- msg$payload
   stopifnot(name %in% names(data.frames(dataset)))
   tbl <- data.frames(dataset)[[name]]
   datasetName <- getName(self)
   payload <- .prepDataframeOrMatrixForJSON(datasetName, tbl)
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
   dataset <- getDataset(self)
   name <- msg$payload
   #printf("ChinookDataset, about to get JSON object with name %s", name)
   json.obj <- getJSON(dataset, name)
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
Dataset.getItemNames <- function(channel, msg)
{
   datasetName <- msg$payload$dataset;

   self <- local.state[["self"]]
   server <- getServer(self)
   dataset <- getDatasetByName(server, datasetName)

   payload <- getItemNames(dataset)
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getItemNames
#----------------------------------------------------------------------------------------------------
Dataset.getItemsByName <- function(channel, msg)
{
   datasetName <- msg$payload$dataset;
   item.names  <- msg$payload$items;

   #printf("===== Dataset.getItemsByName")
   #printf("    datasetName: %s", datasetName)
   #printf("     item.names: %s", item.names)
   
   self <- local.state[["self"]]
   server <- getServer(self)
   dataset <- getDatasetByName(server, datasetName)

   available.items <- getItemNames(dataset)
   #printf("ChinookDataset.getItemByName, available.items:")
   #print(available.items)
   #printf("   requested items: %s", paste(item.names, collapse=","))
   #printf("in? %s", item.names[1] %in% available.items)
   #printf("all in? %s", all(item.names %in% available.items))
   #printf("setdiff: %s", setdiff(item.names, available.items))

   #stopifnot(all(item.names %in% available.items))

   data.list <- vector("list", length=length(item.names))

   i <- 0
   for(name in item.names){
      item <- getItem(dataset, name)
      class <- class(item)
      i <- i + 1
      if(class == "matrix"){
        data.json <- .prepDataframeOrMatrixForJSON(datasetName, item)
        }
      else if(class == "data.frame"){
        data.json <- .prepDataframeOrMatrixForJSON(datasetName, item)
        }
      else{
         data.json <- item
        }
      data.list[[i]] <- data.json
      }

   names(data.list) <- item.names

   payload <- data.list
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # Dataset.getItemsByName
#----------------------------------------------------------------------------------------------------
Dataset.getItemSubsetByName <- function(channel, msg)
{
   datasetName <- msg$payload$dataset;
   item.name  <- msg$payload$item;
   entities <- msg$payload$entities;
   features <- msg$payload$features;

   #printf("===== Dataset.getItemsByName")
   #printf("    datasetName: %s", datasetName)
   #printf("     item.names: %s", item.name)
   
   self <- local.state[["self"]]
   server <- getServer(self)
   dataset <- getDatasetByName(server, datasetName)

   item <- getItem(dataset, item.name, entities=entities, features=features)
   class <- class(item)

   stopifnot(class %in% c("matrix", "data.frame"))
   
   if(class == "matrix"){
      data.json <- .prepDataframeOrMatrixForJSON(datasetName, item)
      }
   else if(class == "data.frame"){
      data.json <- .prepDataframeOrMatrixForJSON(datasetName, item)
      }

  response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=data.json))
  .send(channel, response)

} # Dataset.getItemSubsetByName
#----------------------------------------------------------------------------------------------------
Dataset.getMarkersNetwork <- function(channel, msg)
{
   self <- local.state[["self"]]
   dataset <- getDataset(self)
   tbl.manifest <- manifest(dataset)
   variable.name = "g.markers.json"
   stopifnot(variable.name %in% tbl.manifest$variable)

   payload <- networks(dataset)[[markerName]]
   #printf("wsDatasets.getMarkersAndSamplesNetwork, size: %d", nchar(payload));
   response <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))
   
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

  datasetName <- state[["currentDatasetName"]]
  dataset <- datasets[[datasetName]]

  if(markerName %in% names(networks(dataset))){
     ws$send(toJSON(return.msg))
     return()
     }

} # Dataset.getMarkersNetwork
#----------------------------------------------------------------------------------------------------
Dataset.getSubjectHistoryTable <- function(channel, msg)
{
   self <- local.state[["self"]]
   datasetName <- getName(self)
   dataset <- getDataset(self)
   tbl.history <- getTable(getSubjectHistory(dataset))

   #printf("ChinookDataset.getSubjectHistoryTable, dim (%d, %d)", nrow(tbl.history), ncol(tbl.history))
   payload <- .prepDataframeOrMatrixForJSON(datasetName, tbl.history)
   #print(payload)
   return.msg <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=payload))

   .send(channel, return.msg)

} # Dataset.getSubjectHistoryTable
#----------------------------------------------------------------------------------------------------
Dataset.getNetwork <- function(channel, msg)
{
   self <- local.state[["self"]]
   datasetName <- getName(self)
   dataset <- getDataset(self)
   itemName <- "g.markers.json"
   #networkCategory = msg$payload$networkCategory
   #tbl.manifest <- getManifest(dataset)

   #stopifnot(networkCategory %in% tbl.manifest$subcategory)
   #variableName <- subset(tbl.manifest, subcategory == networkCategory)$variable
   #stopifnot(variableName %in% getItemNames(dataset))
   #json <- getItem(dataset, variableName)
   json <- getItem(dataset, itemName)

   return.msg <- toJSON(list(cmd=msg$callback, status="success", callback="", payload=json))

   .send(channel, return.msg)

} # Dataset.getNetwork
#----------------------------------------------------------------------------------------------------
.send <- function(channel, response)
{
   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
       return(response)

} # .send
#----------------------------------------------------------------------------------------------------

