#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.SttrDataPackage <- setClass ("SttrDataPackageClass", 
                         representation = representation (
                                               name="character",
                                               matrices="list",
                                               data.frames="list",
                                               history="PatientHistoryClass",
                                               manifest="data.frame",
                                               genesets="list",
                                               networks="list",
                                               sampleCategorizations="list")
                         )

#----------------------------------------------------------------------------------------------------
#setGeneric('show',            signature='obj', function (obj) standardGeneric ('show'))
setGeneric('matrices',        signature='obj', function (obj) standardGeneric ('matrices'))
setGeneric('data.frames',     signature='obj', function (obj) standardGeneric ('data.frames'))
setGeneric('history',         signature='obj', function (obj) standardGeneric ('history'))
setGeneric('manifest',        signature='obj', function (obj) standardGeneric ('manifest'))
setGeneric("entities",        signature="obj", function (obj, signature) standardGeneric ("entities"))
setGeneric('getEventList',    signature='obj', function (obj) standardGeneric ('getEventList'))
setGeneric('getEventTypeList',signature='obj', function (obj) standardGeneric ('getEventTypeList'))
setGeneric('getPatientList',  signature='obj', function (obj) standardGeneric ('getPatientList'))
setGeneric('getPatientTable', signature='obj', function (obj, patient.ids=NA, selectCols=NA) standardGeneric ('getPatientTable'))
setGeneric('getGeneSetNames', signature='obj', function (obj) standardGeneric ('getGeneSetNames'))
setGeneric('getGeneSetGenes', signature='obj', function (obj, geneSetName) standardGeneric ('getGeneSetGenes'))
setGeneric('getExpressionDataSetNames', signature='obj', function (obj) standardGeneric ('getExpressionDataSetNames'))
setGeneric('getExpressionDataSetExpression', signature='obj', function (obj, expressionDataSetName) standardGeneric ('getExpressionDataSetExpression'))

setGeneric('getSampleCategorizationNames',
                              signature='obj', function(obj) standardGeneric('getSampleCategorizationNames'))
setGeneric('getSampleCategorization',
                              signature='obj', function(obj, categorizationName) standardGeneric('getSampleCategorization'))
setGeneric('networks',        signature='obj', function (obj) standardGeneric ('networks'))
setGeneric('canonicalizePatientIDs',   signature='obj', function (obj, patient.ids=NA, ...) standardGeneric ('canonicalizePatientIDs'))

#setGeneric("features",    signature="obj", function (obj, signature) standardGeneric ("features"))
#setGeneric("getData",     signature="obj", function (obj, signature, entities=NA, features=NA) standardGeneric ("getData"))
#setGeneric("getAverage",  signature="obj", function (obj, signature, rowsOrColumns, entities=NA, features=NA) standardGeneric("getAverage"))
#setGeneric("dimensions",  signature="obj", function (obj) signature, standardGeneric("dimensions"))

#----------------------------------------------------------------------------------------------------
# constructor
SttrDataPackage <- function(name="", matrices=list(), data.frames=list(), history=PatientHistory(),
                            manifest=data.frame(), genesets=list(), networks=list(),
                            sampleCategorizations=list())
{
  obj <- .SttrDataPackage(name=name, matrices=matrices, data.frames=data.frames, history=history,
                          manifest=manifest, genesets=genesets, networks=networks,
                          sampleCategorizations=sampleCategorizations)

  obj

} # SttrDataPackage constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "SttrDataPackageClass",
  function (obj) {
     msg <- sprintf("SttrDataPackage object with name '%s'", obj@name)
     cat (msg, "\n", sep="")
     print(manifest(obj)[, c("variable", "class", "category", "entity.count", "feature.count")])
     })

#----------------------------------------------------------------------------------------------------
setMethod("matrices", "SttrDataPackageClass",
  function (obj) {
     obj@matrices
     })

#----------------------------------------------------------------------------------------------------
setMethod("data.frames", "SttrDataPackageClass",
  function (obj) {
     obj@data.frames
     })

#----------------------------------------------------------------------------------------------------
setMethod("history", "SttrDataPackageClass",
  function (obj) {
     obj@history
     })

#----------------------------------------------------------------------------------------------------
setMethod("manifest", "SttrDataPackageClass",
  function (obj) {
     obj@manifest
     })

#----------------------------------------------------------------------------------------------------
setMethod ("entities", "SttrDataPackageClass",  

   function(obj, signature) {
      if(signature %in% names(obj@matrices))
         return(rownames(obj@matrices[[signature]]))
      else if(signature %in% names(obj@data.frames))
         return(rownames(obj@data.frames[[signature]]))
      else
         return(NA)
      })
 #----------------------------------------------------------------------------------------------------
setMethod("getEventList", "SttrDataPackageClass",
   function (obj) {

      stopifnot(class(obj@history)[1] == "PatientHistoryClass")
      # test that the slot is not null
      geteventList(obj@history)
    })
 #----------------------------------------------------------------------------------------------------
setMethod("getEventTypeList", "SttrDataPackageClass",
   function (obj) {

      stopifnot(class(obj@history)[1] == "PatientHistoryClass")
      # test that the slot is not null
      geteventTypeList(obj@history)
    })
 #----------------------------------------------------------------------------------------------------
setMethod("getPatientList", "SttrDataPackageClass",
   function (obj) {

      stopifnot(class(obj@history)[1] == "PatientHistoryClass")
      # test that the slot is not null
      getpatientList(obj@history)
    })
    
#----------------------------------------------------------------------------------------------------
setMethod("getPatientTable", "SttrDataPackageClass",
   function (obj, patient.ids=NA, selectCols=NA) {

    stopifnot(class(obj@history)[1] == "PatientHistoryClass")
      # test that the slot is not null
    getTable(obj@history, patient.ids, selectCols)
    })
          
#---------------------------------------------------------------------------------------------------
# data.directory will contain a manifest.tsv file, which names and describes data files of
# several sorts (matrices, data.frames, a history file) which together describe a study
.loadFiles <- function(data.directory)
{
   stopifnot(file.exists(data.directory))
   manifest.file <- file.path(data.directory, "manifest.tsv")
   
   tbl <- read.table(manifest.file, sep="\t", as.is=TRUE)
   stopifnot(colnames(tbl) == c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))

   matrix.count <- length(grep("matrix", tbl$class))
   data.frame.count <- length(grep("data.frame", tbl$class))
   matrices <- vector("list", matrix.count)
   data.frames <- vector("list", data.frame.count)

   clinical <- PatientHistory()
   if(length(grep("history", tbl$category)) == 0)
       warning("no history events found")
 
   genesets <- list()
   if(length(grep("geneset", tbl$category)) == 0)
       warning("no genesets found")

   network.count <- length(grep("network", tbl$category))
   networks <- vector("list", network.count)
   if(network.count == 0)
       warning("no networks found")
 
   sampleCategorizations.found <- length(grep("categorized samples", tbl$category))
   sampleCategorizations <- vector("list", sampleCategorizations.found)
   if(sampleCategorizations.found == 0)
     warning("no categorized samples found")
   
     # re-initialize these so that they can be tracked as each row and data object is read in
   matrices.found <- 0
   data.frames.found <- 0
   networks.found <- 0
   sampleCategorizations.found <- 0
   
   for(i in 1:nrow(tbl)){
      file.name <- rownames(tbl)[i]
      full.name <- file.path(data.directory, file.name)
      variable.name <- tbl$variable[i]
      stopifnot(load(full.name) == variable.name)
      class <- tbl$class[i]
      category <- tbl$category[i]
      if(class == "matrix") {
         matrices.found <- matrices.found + 1
         eval(parse(text=sprintf("matrices[[%d]] <- %s", matrices.found, variable.name)))
         names(matrices)[matrices.found] <- variable.name;
         }
      else if(class == "list" & category=="history") {
         eval(parse(text=sprintf("historyList <- %s", variable.name)))
         if(variable.name == "history")        clinical <- PatientHistory::seteventList(clinical, historyList)
         if(variable.name == "ptList")         clinical <- PatientHistory::setpatientList(clinical, historyList)
         if(variable.name == "catList")  clinical <- PatientHistory::seteventTypeList(clinical, historyList)

         }
      else if(class == "list" & category=="geneset") {
         eval(parse(text=sprintf("genesets <- %s", variable.name)))
         }
      else if(class == "character" & category=="network") {
         networks.found <- networks.found + 1
         eval(parse(text=sprintf("networks[[%d]] <- %s", networks.found, variable.name)))
         names(networks)[networks.found] <- variable.name
         }
      else if(class == "data.frame" & category=="categorized samples") {
         sampleCategorizations.found <- sampleCategorizations.found + 1
         eval(parse(text=sprintf("sampleCategorizations[[%d]] <- %s", sampleCategorizations.found, variable.name)))
         names(sampleCategorizations)[sampleCategorizations.found] <- variable.name
         }
      else if(class == "data.frame" & category=="history") {
		 eval(parse(text=sprintf("tbl.ptHistory <- %s", variable.name)))
		 clinical <- PatientHistory::setTable(clinical, tbl.ptHistory)
		 }
      else if(class == "data.frame") {
         data.frames.found <- data.frames.found + 1
         eval(parse(text=sprintf("data.frames[[%d]] <- %s", data.frames.found, variable.name)))
         names(data.frames)[data.frames.found] <- variable.name;
         }
      } # for i

    printf("SttrDataPackage ctor, networks.found: %d", networks.found)
    result <- list(manifest=tbl, matrices=matrices, data.frames=data.frames,
                   history=clinical, genesets=genesets, networks=networks,
                   sampleCategorizations=sampleCategorizations)
    
    return(result)

} # .loadFiles

#---------------------------------------------------------------------------------------------------
# data.connection will contain a manifest.tsv file, which names and describes data files of
# several sorts (matrices, data.frames, a history file) which together describe a study
.loadTables <- function(data.directory, data.connection)
{
   stopifnot(file.exists(data.directory))
   manifest.file <- file.path(data.directory, "manifest.tsv")
   
   tbl <- read.table(manifest.file, sep="\t", as.is=TRUE)
   stopifnot(colnames(tbl) == c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))

   matrix.count <- length(grep("matrix", tbl$class))
   data.frame.count <- length(grep("data.frame", tbl$class))
   matrices <- vector("list", matrix.count)
   data.frames <- vector("list", data.frame.count)


   history <- PatientHistory()
   if(length(grep("history", tbl$category)) == 0)
       warning("no history events found")
 
   genesets <- list()
   if(length(grep("geneset", tbl$category)) == 0)
       warning("no genesets found")

   network.count <- length(grep("network", tbl$category))
   networks <- vector("list", network.count)
   if(network.count == 0)
       warning("no networks found")
 
   matrices.found <- 0
   data.frames.found <- 0
   networks.found <- 0
   tables <- sqlTables(data.connection)[, "TABLE_NAME"]
    
   for(i in 1:nrow(tbl)){
      file.name <- rownames(tbl)[i]
      variable.name <- tbl$variable[i]
      class <- tbl$class[i]
      category <- tbl$category[i]
  
      table <- sqlFetch(data.connection, variable.name)

      if(class == "matrix") {
         matrices.found <- matrices.found + 1
         matrices[[matrices.found]] <- as.matrix(table)
         names(matrices)[matrices.found] <- variable.name;
         }
      else if(class == "data.frame") {
         data.frames.found <- data.frames.found + 1
         matrices[[data.frames.found]] <- table
         names(data.frames)[data.frames.found] <- variable.name;
         }
      else if(class == "list" & category=="history") {
          historyEvents<- apply(table,1, function(item){
            as.list(item)
          })
          historyList <- lapply(historyEvents, function(event) {c(event[1:4], Fields=list(fromJSON(event$Fields))) })
          
          history <- PatientHistory(historyList)
         }
      else if(class == "list" & category=="geneset") {
         eval(parse(text=sprintf("genesets <- %s", variable.name)))
         }
      else if(class == "character" & category=="network") {
         networks.found <- networks.found + 1
         eval(parse(text=sprintf("networks[[%d]] <- %s", networks.found, variable.name)))
         names(networks)[networks.found] <- variable.name
         }
      } # for i

    printf("SttrDataPackage ctor, networks.found: %d", networks.found)
    result <- list(manifest=tbl, matrices=matrices, data.frames=data.frames,
                   history=history, genesets=genesets, networks=networks)
    
    return(result)

} # .loadTables

#----------------------------------------------------------------------------------------------------
setMethod("getGeneSetNames", "SttrDataPackageClass",

  function (obj) {
     names(obj@genesets)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getGeneSetGenes", "SttrDataPackageClass",

  function (obj, geneSetName) {
     if(!geneSetName %in% getGeneSetNames(obj)){
        message("Error in getGeneSetGenes: no geneset named '%s'", geneSetName)
        return(NA)
        }
     return(obj@genesets[[geneSetName]])
     })

#----------------------------------------------------------------------------------------------------
setMethod("getExpressionDataSetNames", "SttrDataPackageClass",

  function (obj) {
     rownames(obj@manifest)[grep("mrna",rownames(obj@manifest))]
  })
#----------------------------------------------------------------------------------------------------
setMethod("getExpressionDataSetExpression", "SttrDataPackageClass",

  function (obj, expressionDataSetName) {
     if(!expressionDataSetName %in% getExpressionDataSetNames(obj)){
        message("Error in getExpressionDataSetExpression: no Expression DataSet named '%s'", expressionDataSetName)
        return(NA)
        }
     return(obj@matrices[[expressionDataSetName]])
     })
#----------------------------------------------------------------------------------------------------
setMethod("getSampleCategorizationNames", "SttrDataPackageClass",

  function (obj) {
     names(obj@sampleCategorizations)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSampleCategorization", "SttrDataPackageClass",

  function (obj, categorizationName) {
     if(!categorizationName %in% getSampleCategorizationNames(obj)){
        message("Error in getSampleCategorization: no categorization named '%s'", categorizationName)
        return(NA)
        }
     return(obj@sampleCategorizations[[categorizationName]])
     })

#----------------------------------------------------------------------------------------------------
setMethod("networks", "SttrDataPackageClass",

  function (obj) {
     return(obj@networks)
     })

#----------------------------------------------------------------------------------------------------
