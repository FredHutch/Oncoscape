#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.Groups <- setClass ("Groups", 
                     representation = representation (
                                            name="character",
                                            groups="environment")
                     )
#----------------------------------------------------------------------------------------------------
setGeneric("getName",              signature="obj", function(obj) standardGeneric ("getName"))
setGeneric("getGroupNames",        signature="obj", function(obj) standardGeneric ("getGroupNames"))
setGeneric("getGroup",             signature="obj", function(obj, name) standardGeneric ("getGroup"))
setGeneric("createColorList",      signature="obj", function(obj, ids, target.group, tbl.viz) standardGeneric ("createColorList"))
setGeneric("createColorLegend",    signature="obj", function(obj, target.group, tbl.viz) standardGeneric ("createColorLegend"))
#----------------------------------------------------------------------------------------------------
Groups <- function(name="", data.directory=system.file(package="Groups", "extdata"))
{
  dictionary <- .loadFiles(data.directory)
    
  .Groups(name=name, groups=dictionary)

} # Groups constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "Groups",

   function(object){
     msg <- sprintf("a Groups object, containing %d identifier groups", length(ls(object@groups)))
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod("getName", "Groups",

  function (obj) {
    return(obj@name)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getGroupNames", "Groups",

  function (obj) {
    return(ls(obj@groups))
    })

#----------------------------------------------------------------------------------------------------
# at present, subsetting is supported only for 2d data items - matrices and data.frames
setMethod("getGroup", "Groups",

  function (obj, name) {

    if(!name %in% getGroupNames(obj))
       return(NA)

    obj@groups[[name]]
    })

#----------------------------------------------------------------------------------------------------
# data.directory will contain a manifest.tsv file, which names and describes data files of
# several sorts (matrices, data.frames, a history file) which together describe a study
.loadFiles <- function(data.directory)
{
  dictionary <- new.env(parent=emptyenv())
  
  stopifnot(file.exists(data.directory))
  subdirs <- dir(data.directory)

  for(subdir in subdirs){
     files <- list.files(file.path(data.directory, subdir))
     for(file in files){
        full.path <- file.path(data.directory, subdir, file)
        #printf("full.path: %s (%s)", full.path, file.exists(full.path))
        contents <- scan(full.path, sep="\n", what=character(0), quiet=TRUE)
        dictionary[[file]] <- contents
        } # for file
    } # for subdir

   dictionary

} # .loadFiles
#---------------------------------------------------------------------------------------------------
setMethod("createColorList", "Groups",

  function (obj, ids, target.group, tbl.viz) {
   subgroups <- grep(target.group, unlist(getGroupNames(obj), use.names=FALSE), value=TRUE)

   ids.by.group <- lapply(subgroups, function(group) intersect(ids, getGroup(obj, group)))
   names(ids.by.group) <- subgroups

   tbl.work <- data.frame(id=ids, meta.group=target.group, group="", color="lightgray")

   groups.for.ids <- rep("unassigned", length(ids))
   colors         <- rep("lightgray", length(ids))
   
   names(groups.for.ids) <- ids
   names(colors) <- ids
   
   for(id in tbl.work$id){
      index <- which(as.logical(lapply(subgroups, function(name) id %in% getGroup(obj, name))))
      if(length(index) == 1){
        group <- subgroups[index]
        target.groupWithTrailingDot <- sprintf("%s.", target.group)
        group.shortened <- gsub(target.groupWithTrailingDot, "", group)
        groups.for.ids[[id]] <- group.shortened
        color <- tbl.viz$color[match(group.shortened, tbl.viz$id)]
        if(!is.na(color))
           colors[[id]] <- color
        #printf("%s: %d: %s   %s -> %s", id, index, subgroups[index], target.group, group.shortened)
        } # if  id found in a Groups list
      } # for id

   tbl.work$group <- groups.for.ids
   tbl.work$color <- colors

        # to convert to a json-friendly list
   tumor.colors <- tbl.work$color
   names(tumor.colors) <- tbl.work$id

   as.list(tumor.colors)
   }) # createColorList

#----------------------------------------------------------------------------------------------------
setMethod("createColorLegend", "Groups",

  function (obj, target.group, tbl.viz) {

     tbl.tmp <- subset(tbl.viz, group == target.group, select=c("id", "color"))
     result <- as.list(tbl.tmp$color)
     names(result) <- tbl.tmp$id

     result
     
    }) # createColorList

#----------------------------------------------------------------------------------------------------
