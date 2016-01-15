#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.Groups <- setClass ("Groups", 
                      representation = representation (
                                            groups="environment")
                     )
#----------------------------------------------------------------------------------------------------
setGeneric("getGroupNames",        signature="obj", function(obj) standardGeneric ("getGroupNames"))
setGeneric("getGroup",             signature="obj", function(obj, name) standardGeneric ("getGroup"))
#----------------------------------------------------------------------------------------------------
Groups <- function(data.directory=system.file(package="Groups", "extdata"))
{
  dictionary <- .loadFiles(data.directory)
    
  obj <- .Groups(groups=dictionary)
  
  obj

} # Groups constructor
#----------------------------------------------------------------------------------------------------
setMethod("getGroupNames", "Groups",

  function (obj) {
    return(ls(obj@dictionary))
    })

#----------------------------------------------------------------------------------------------------
# at present, subsetting is supported only for 2d data items - matrices and data.frames
setMethod("getGroup", "Groups",

  function (obj, name) {

    if(!name %in% getGroupNames(obj))
       return(NA)

    obj@dictionary[[name]]
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
