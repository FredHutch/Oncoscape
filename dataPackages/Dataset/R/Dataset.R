#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.Dataset <- setClass ("Dataset",
                      representation = representation (
                                            name="character",
                                            manifest="data.frame",
                                            subjectHistory="SubjectHistory",
                                            dictionary="environment")
                     )
#----------------------------------------------------------------------------------------------------
setGeneric("getName",              signature="obj", function(obj) standardGeneric ("getName"))
setGeneric("getManifest",          signature="obj", function(obj) standardGeneric ("getManifest"))
setGeneric("getSubjectHistory",    signature="obj", function(obj) standardGeneric ("getSubjectHistory"))
setGeneric("getItemNames",         signature="obj", function(obj) standardGeneric("getItemNames"))
setGeneric("getItem",              signature="obj", function(obj, name, entities=NA, features=NA) standardGeneric("getItem"))
setGeneric("sampleIdToSubjectId",  signature="obj", function(obj, sample.ids) standardGeneric ("sampleIdToSubjectId"))
#----------------------------------------------------------------------------------------------------
Dataset <- function(name="", manifest=data.frame(), history=SubjectHistory(), dictionary=new.env(parent=emptyenv()))
{
  obj <- .Dataset(name=name, manifest=manifest, subjectHistory=history, dictionary=dictionary)

  obj

} # Dataset constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "Dataset",

  function (object) {
     msg <- sprintf("a Dataset with name '%s', %d data items", object@name, length(ls(object@dictionary)))
     cat (msg, "\n", sep="")
     if(nrow(getManifest(object)) > 0)
       print(getManifest(object)[, c("variable", "class", "category", "entity.count", "feature.count")])
     })

#----------------------------------------------------------------------------------------------------
setMethod("getName", "Dataset",

  function (obj) {
    return(obj@name)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getItemNames", "Dataset",

  function (obj) {
    return(ls(obj@dictionary))
    })

#----------------------------------------------------------------------------------------------------
# at present, subsetting is supported only for 2d data items - matrices and data.frames
setMethod("getItem", "Dataset",

  function (obj, name, entities=NA, features=NA) {

    if(!name %in% getItemNames(obj))
       return(NA)

    x <- obj@dictionary[[name]]

    if(class(x) %in% c("matrix", "data.frame")){
       if(!all(is.na(entities)))
         x <- x[intersect(entities, rownames(x)),]
       if(!all(is.na(features)))
         x <- x[, intersect(features, colnames(x))]
       } # matrix or data.frame
    x
    })

#----------------------------------------------------------------------------------------------------
setMethod("getManifest", "Dataset",

  function (obj) {
     obj@manifest
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSubjectHistory", "Dataset",

  function (obj) {
     obj@subjectHistory
     })

#----------------------------------------------------------------------------------------------------
setMethod("sampleIdToSubjectId", "Dataset",

  function (obj, sample.ids) {
     sample.ids
     })

#----------------------------------------------------------------------------------------------------
# data.directory will contain a manifest.tsv file, which names and describes data files of
# several sorts (matrices, data.frames, a history file) which together describe a study
.loadFiles <- function(data.directory, tbl.manifest)
{
  stopifnot(file.exists(data.directory))

  dictionary <- new.env(parent=emptyenv())

    # pull out the SubjectHistory files, if any

  if(nrow(tbl.manifest) > 0)
    for(i in 1:nrow(tbl.manifest)){
       class <- tbl.manifest[i, "class"]
       variable.name <- tbl.manifest[i, "variable"]
       category <- tbl.manifest[i, "category"]
       file.name <- rownames(tbl.manifest)[i]
       full.path <- file.path(data.directory, file.name)
       stopifnot(load(full.path) == variable.name)
       cmd.string <- sprintf("dictionary[['%s']] <- %s", variable.name, variable.name)
       eval(parse(text=cmd.string))
       } # for i

      # now create the SubjectHistory object.  it will be
      #   1) empty
      #   2) constructed from a data.frame
      #   3) constructed from an event list
      #   4) constructed from both

      # first set up empty objects to use in the constructor
   eventList <- list()
   table <- data.frame()
      # now see if actual variables are mentioned in the manifest, and
      # have been read into the dictionary, in which case grab them,
      # delete them from the dictionary

   tbl.eventList <- subset(tbl.manifest, category=="SubjectHistory" & subcategory=="eventList")

   if(nrow(tbl.eventList) == 1){
      eventList.variable <- tbl.eventList$variable
      eventList <- dictionary[[eventList.variable]]
      rm(list=eventList.variable, pos=dictionary)
      }

   tbl.table <- subset(tbl.manifest, category=="subjectHistory" & subcategory=="table")
   if(nrow(tbl.table) == 1){
     table.variable <- tbl.table$variable
     table <- dictionary[[table.variable]]
     rm(list=table.variable, pos=dictionary)
     }

   subjectHistory <- SubjectHistory(table, eventList)

   return(list(dictionary=dictionary, subjectHistory=subjectHistory))

} # .loadFiles
#---------------------------------------------------------------------------------------------------
