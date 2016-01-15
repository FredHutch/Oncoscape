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
     #printf("----- %s", subdir)
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
