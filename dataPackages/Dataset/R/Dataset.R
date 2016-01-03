#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.Dataset <- setClass ("Dataset", 
                         representation = representation (
                                               name="character",
                                               matrices="list",
                                               data.frames="list",
                                               #history="SubjectHistory",
                                               history="data.frame",
                                               manifest="data.frame",
                                               genesets="list",
                                               networks="list",
                                               json.objects="list",
                                               sampleCategorizations="list",
                                               dictionary="environment")
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('getItemNames',    signature='obj', function(obj) standardGeneric('getItemNames'))
setGeneric('getItemByName',   signature='obj', function(obj, name) standardGeneric('getItemByName'))
setGeneric('matrices',        signature='obj', function (obj) standardGeneric ('matrices'))
setGeneric('data.frames',     signature='obj', function (obj) standardGeneric ('data.frames'))
setGeneric('history',         signature='obj', function (obj) standardGeneric ('history'))
setGeneric('manifest',        signature='obj', function (obj) standardGeneric ('manifest'))
setGeneric('getJSON',         signature='obj', function (obj, variableName) standardGeneric ('getJSON'))
setGeneric("entities",        signature="obj", function (obj, signature) standardGeneric ("entities"))
#setGeneric('getEventList',    signature='obj', function (obj) standardGeneric ('getEventList'))
#setGeneric('getEventTypeList',signature='obj', function (obj) standardGeneric ('getEventTypeList'))
#setGeneric('getSubjectList',  signature='obj', function (obj) standardGeneric ('getSubjectList'))
#setGeneric('getSubjectTable', signature='obj', function (obj, subject.ids=NA, selectCols=NA) standardGeneric ('getSubjectTable'))
setGeneric('getGeneSetNames', signature='obj', function (obj) standardGeneric ('getGeneSetNames'))
setGeneric('getGeneSetGenes', signature='obj', function (obj, geneSetName) standardGeneric ('getGeneSetGenes'))
setGeneric('getSampleCategorizationNames',
                              signature='obj', function(obj) standardGeneric('getSampleCategorizationNames'))
setGeneric('getSampleCategorization',
                              signature='obj', function(obj, categorizationName) standardGeneric('getSampleCategorization'))
setGeneric('networks',        signature='obj', function (obj) standardGeneric ('networks'))
setGeneric('canonicalizeSampleIDs',   signature='obj', function (obj, sample.ids=NA, ...) standardGeneric ('canonicalizeSampleIDs'))

#setGeneric("features",    signature="obj", function (obj, signature) standardGeneric ("features"))
#setGeneric("getData",     signature="obj", function (obj, signature, entities=NA, features=NA) standardGeneric ("getData"))
#setGeneric("getAverage",  signature="obj", function (obj, signature, rowsOrColumns, entities=NA, features=NA) standardGeneric("getAverage"))
#setGeneric("dimensions",  signature="obj", function (obj) signature, standardGeneric("dimensions"))

#----------------------------------------------------------------------------------------------------
# constructor
Dataset <- function(name="", matrices=list(), data.frames=list(), history=data.frame(),
                             manifest=data.frame(), genesets=list(), json.objects=list(),
                             networks=list(), sampleCategorizations=list(), dictionary=new.env(parent=emptyenv()))
{
  obj <- .Dataset(name=name, matrices=matrices, data.frames=data.frames, history=history,
                  manifest=manifest, genesets=genesets, json.objects=json.objects,
                  networks=networks, sampleCategorizations=sampleCategorizations,
                  dictionary=dictionary)

  #browser()
  if(nrow(manifest) > 0)
    for(i in 1:nrow(manifest)){
       class <- manifest[i, "class"]
       variable.name <- manifest[i, "variable"]
       category <- manifest[i, "category"]
       if(class == "matrix"){
          obj@dictionary[[variable.name]] <- matrices[[variable.name]]
          }
       else if(class == "data.frame"){
          if(category == "history")
             obj@dictionary[[variable.name]] <- history
          else
            obj@dictionary[[variable.name]] <- data.frames[[variable.name]]
          }
       else if(class == "json"){
          obj@dictionary[[variable.name]] <- json.objects[[variable.name]]
          }
       else if(class == "SubjectHistory"){
          obj@dictionary[[variable.name]] <- history
          }
       } # for i

  obj

} # Dataset constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "Dataset",

  function (obj) {
     msg <- sprintf("Dataset object with name '%s'", obj@name)
     cat (msg, "\n", sep="")
     print(manifest(obj)[, c("variable", "class", "category", "entity.count", "feature.count")])
     })

#----------------------------------------------------------------------------------------------------
setMethod("getItemNames", "Dataset",

  function (obj) {
    return(ls(obj@dictionary))
    })

#----------------------------------------------------------------------------------------------------
setMethod("getItemByName", "Dataset",

  function (obj, name) {
    if(!name %in% getItemNames(obj))
      return(NA)
    return(obj@dictionary[[name]])
    })

#----------------------------------------------------------------------------------------------------
setMethod("matrices", "Dataset",

  function (obj) {
     obj@matrices
     })

#----------------------------------------------------------------------------------------------------
setMethod("data.frames", "Dataset",

  function (obj) {
     obj@data.frames
     })

#----------------------------------------------------------------------------------------------------
setMethod("history", "Dataset",

  function (obj) {
     obj@history
     })

#----------------------------------------------------------------------------------------------------
setMethod("manifest", "Dataset",

  function (obj) {
     obj@manifest
     })

#----------------------------------------------------------------------------------------------------
setMethod("getJSON", "Dataset",

  function (obj, variableName) {
      if(variableName %in% names(obj@json.objects))
          return(obj@json.objects[[variableName]])
      NA
     })

#----------------------------------------------------------------------------------------------------
setMethod ("entities", "Dataset",  

   function(obj, signature) {
      if(signature %in% names(obj@matrices))
         return(rownames(obj@matrices[[signature]]))
      else if(signature %in% names(obj@data.frames))
         return(rownames(obj@data.frames[[signature]]))
      else
         return(NA)
      })
 #----------------------------------------------------------------------------------------------------
#setMethod("getEventList", "Dataset",
#
#   function (obj) {
#
#      stopifnot(class(obj@history)[1] == "SubjectHistory")
#      # test that the slot is not null
#      getEventList(obj@history)
#    })
# #----------------------------------------------------------------------------------------------------
#setMethod("getEventTypeList", "Dataset",
#
#   function (obj) {
#
#      stopifnot(class(obj@history)[1] == "SubjectHistory")
#      # test that the slot is not null
#      getEventTypeList(obj@history)
#    })
# #----------------------------------------------------------------------------------------------------
#setMethod("getSubjectList", "Dataset",
#
#   function (obj) {
#
#      stopifnot(class(obj@history)[1] == "SubjectHistory")
#      # test that the slot is not null
#      getSubjectList(obj@history)
#    })
#    
##----------------------------------------------------------------------------------------------------
#setMethod("getSubjectTable", "Dataset",
#
#   function (obj, subject.ids=NA, selectCols=NA) {
#
#    stopifnot(class(obj@history)[1] == "SubjectHistory")
#      # test that the slot is not null
#    getTable(obj@history, subject.ids, selectCols)
#    })
#          
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

   #clinical <- SubjectHistory()
   #if(length(grep("history", tbl$category)) == 0)
   #    warning("no history events found")
 
   genesets <- list()
   #if(length(grep("geneset", tbl$category)) == 0)
   #    warning("no genesets found")

   json.objects <- list()

   network.count <- length(grep("network", tbl$category))
   networks <- vector("list", network.count)
   #if(network.count == 0)
   #    warning("no networks found")
 
   sampleCategorizations.found <- length(grep("categorized samples", tbl$category))
   sampleCategorizations <- vector("list", sampleCategorizations.found)
   #if(sampleCategorizations.found == 0)
   #  warning("no categorized samples found")
   
     # re-initialize these so that they can be tracked as each row and data object is read in
   matrices.found <- 0
   data.frames.found <- 0
   networks.found <- 0
   sampleCategorizations.found <- 0
   json.objects.found <- 0
   
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
         #if(variable.name == "history")        clinical <- SubjectHistory::seteventList(clinical, historyList)
         #if(variable.name == "ptList")         clinical <- SubjectHistory::setsubjectList(clinical, historyList)
         #if(variable.name == "catList")  clinical <- SubjectHistory::seteventTypeList(clinical, historyList)

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
		 eval(parse(text=sprintf("tbl.subjectHistory <- %s", variable.name)))
		 history <- tbl.subjectHistory
		 #clinical <- SubjectHistory::setTable(clinical, tbl.subjectHistory)
		 }
      else if(class == "data.frame") {
         data.frames.found <- data.frames.found + 1
         eval(parse(text=sprintf("data.frames[[%d]] <- %s", data.frames.found, variable.name)))
         names(data.frames)[data.frames.found] <- variable.name;
         }
      else if(class == "json"){
         json.objects.found <- json.objects.found + 1
         eval(parse(text=sprintf("json.objects[[%d]] <- %s", json.objects.found, variable.name)))
         names(json.objects)[json.objects.found] <- variable.name;
         }
      } # for i

    result <- list(manifest=tbl, matrices=matrices, data.frames=data.frames,
                   history=history, genesets=genesets, json.objects=json.objects,
                   networks=networks, sampleCategorizations=sampleCategorizations)
    
    return(result)

} # .loadFiles
#---------------------------------------------------------------------------------------------------
setMethod("getGeneSetNames", "Dataset",

  function (obj) {
     names(obj@genesets)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getGeneSetGenes", "Dataset",

  function (obj, geneSetName) {
     if(!geneSetName %in% getGeneSetNames(obj)){
        message("Error in getGeneSetGenes: no geneset named '%s'", geneSetName)
        return(NA)
        }
     return(obj@genesets[[geneSetName]])
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSampleCategorizationNames", "Dataset",

  function (obj) {
     names(obj@sampleCategorizations)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSampleCategorization", "Dataset",

  function (obj, categorizationName) {
     if(!categorizationName %in% getSampleCategorizationNames(obj)){
        message("Error in getSampleCategorization: no categorization named '%s'", categorizationName)
        return(NA)
        }
     return(obj@sampleCategorizations[[categorizationName]])
     })

#----------------------------------------------------------------------------------------------------
setMethod("networks", "Dataset",

  function (obj) {
     return(obj@networks)
     })

#----------------------------------------------------------------------------------------------------
