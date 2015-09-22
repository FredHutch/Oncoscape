#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.UserDataStore <- setClass ("UserDataStore", 
                            representation = representation (
                                               userID="character",
                                               userGroups="list",
                                               URI="character",
                                               userDirectory="character")
                         )

#----------------------------------------------------------------------------------------------------
setGeneric("show",             signature="obj", function (obj) standardGeneric ("show"))
setGeneric("getUserID",        signature="obj", function (obj) standardGeneric ("getUserID"))
setGeneric("getUserGroups",    signature="obj", function (obj) standardGeneric ("getUserGroups"))
setGeneric("getURI",           signature="obj", function (obj) standardGeneric ("getURI"))
setGeneric("getUserDirectory", signature="obj", function (obj) standardGeneric ("getUserDirectory"))
setGeneric("addData",          signature="obj", function (obj, dataItem, name, group, permissions, tags) standardGeneric ("addData"))
setGeneric("deleteDataItem",   signature="obj", function (obj, dataItemID)     standardGeneric ("deleteDataItem"))
setGeneric("getSummary",       signature="obj", function (obj) standardGeneric ("getSummary"))
setGeneric("getDataItem",      signature="obj", function (obj, dataItemID) standardGeneric ("getDataItem"))
#----------------------------------------------------------------------------------------------------
# constructor
UserDataStore <- function(userID=NA_character_, userGroups=list())
{
  stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0);
  uri <- Sys.getenv("ONCOSCAPE_USER_DATA_STORE")
  stopifnot(grep("file://", uri, fixed=TRUE) == 1)
  tokens <- strsplit(uri, "://", fixed=TRUE)[[1]];
  stopifnot(length(tokens) == 2)
  repo.path <- tokens[2]
  stopifnot(file.exists(repo.path))
  
  userDirectory <- NA_character_  # if userID is provided, then a sensible value will be assigned below

  obj <- .UserDataStore(userID=userID, userGroups=userGroups, URI=uri, userDirectory=userDirectory);

  if(!is.na(userID)) {
     userDirectory <- file.path(repo.path, userID)
     if(!file.exists(userDirectory)){
        dir.create(userDirectory)
        }
     metadata.filename <- sprintf("%s/metadata.RData", userDirectory)
     if(!file.exists(metadata.filename)){
        tbl <- .metadata.template()
        save(tbl, file=metadata.filename)
        }

     } # if userID and userGroups

  obj@userDirectory <- userDirectory

  obj

} # UserDataStore constructor
#----------------------------------------------------------------------------------------------------
.metadata.template <- function()
{
  data.frame(file=character(),
             name=character(),
             user=character(),
             group=character(),
             created=character(),
             permissions=integer(),
             tags=character(),
             stringsAsFactors=FALSE) 

} # .metadata.template
#----------------------------------------------------------------------------------------------------
setMethod("show", "UserDataStore",
  function (obj) {
     msg <- sprintf("UserDataStore object for '%s'", obj@userID)
     cat (msg, "\n", sep="")
     msg <- sprintf("  groups: %s", paste(obj@userGroups, collapse=", "))
     cat (msg, "\n", sep="")
     msg <- sprintf("     URI: %s", paste(obj@URI, collapse=", "))
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod("getUserID", "UserDataStore",
  function (obj) {
     obj@userID
     })

#----------------------------------------------------------------------------------------------------
setMethod("getUserGroups", "UserDataStore",
  function (obj) {
     obj@userGroups
     })

#----------------------------------------------------------------------------------------------------
setMethod("getURI", "UserDataStore",
  function (obj) {
     obj@URI
     })

#----------------------------------------------------------------------------------------------------
setMethod("getUserDirectory", "UserDataStore",
  function (obj) {
     obj@userDirectory
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSummary", "UserDataStore",
   function(obj) {
     full.path <- file.path(getUserDirectory(obj), "metadata.RData")
     if(!file.exists(full.path)){
        warning(sprintf("no datastore summary found for %s in %s", getUserID(obj),
                        getUserDirectory(obj)));
        return(NA);
        }
    load(full.path);
    return(tbl)
    })

#----------------------------------------------------------------------------------------------------
setMethod("addData", "UserDataStore",
   function(obj, dataItem, name, group, permissions, tags) {
     user.dir <- getUserDirectory(obj)
       #  next.unclaimed.number <- length(list.files(user.dir))
     next.unclaimed.number <- .deduceNextAvailableFileNumber(user.dir)
     short.name <- sprintf("data%04d", next.unclaimed.number);
     serialized.data.filename <- sprintf("%s/%s.RData", user.dir, short.name)
     save(dataItem, file=serialized.data.filename)
     stopifnot(file.exists(serialized.data.filename))
        # update the metadata
     metadata.filename <- file.path(getUserDirectory(obj), "metadata.RData")
     load(metadata.filename)  # named "tbl"
     new.row <- list(file=short.name,
                     name=name,
                     user=getUserID(obj),
                     group=paste(getUserGroups(obj), collapse=";"),
                     created=as.character(Sys.time()),
                     permissions=permissions,
                     tags=paste(tags, collapse=";"))
     #print("------ new metadata");
     #print(new.row)
     tbl <- rbind(tbl, data.frame(new.row, stringsAsFactors=FALSE))
     save(tbl, file=metadata.filename)
     }) # addData

#----------------------------------------------------------------------------------------------------
# dataItemID is currently the filename, found in the datastore directory as, eg, "file0003.RData"
# and in the metadata table, column "file", as "file0003"
# read and return the data
#
setMethod("getDataItem", "UserDataStore",

   function(obj, dataItemID) {

     user.dir <- getUserDirectory(obj)
     serialized.data.filename <- sprintf("%s/%s.RData", user.dir, dataItemID)
     if(!file.exists(serialized.data.filename)){
        warning(sprintf("dataItemID '%s' for userID '%s' not found",
                        dataItemID, getUserID(obj)));
        return(NA)
        }
     load(serialized.data.filename)
     return(dataItem)
     }) # getDataItem

#----------------------------------------------------------------------------------------------------
# dataItemID is currently the filename, found in the datastore directory as, eg, "file0003.RData"
# and in the metadata table, column "file", as "file0003"
# remove the file from the directory, and its row from the metadata table
#
setMethod("deleteDataItem", "UserDataStore",
   function(obj, dataItemID) {
     user.dir <- getUserDirectory(obj)
     serialized.data.filename <- sprintf("%s/%s.RData", user.dir, dataItemID)
     if(!file.exists(serialized.data.filename))
        return(FALSE)

        # TODO: promote this next operation to a class method
     metadata.filename <- file.path(getUserDirectory(obj), "metadata.RData")
     load(metadata.filename)  # named "tbl"
     unlink(serialized.data.filename)
     row.to.delete <- grep(dataItemID, tbl$file)
     if(length(row.to.delete) != 1)
         return(FALSE)
     
     stopifnot(length(row.to.delete) == 1)
     tbl <- tbl[-row.to.delete,]
     save(tbl, file=metadata.filename)
     return(TRUE)
     }) # deleteDataItem

#----------------------------------------------------------------------------------------------------
.deduceNextAvailableFileNumber <- function(userDirectory)
{
   datafile.regex <- "data[0-9]+.RData";
   files <- grep(datafile.regex, list.files(userDirectory), v=TRUE)
   if(length(files) == 0)
       return (1)
   tokens <- unlist(strsplit(files, ".RData", fixed=TRUE))
   numbers.as.strings <- sub("^data", "", tokens)
   current.max <- max(as.integer(numbers.as.strings))
   current.max + 1

} # .deduceNextAvailableFileNumber
#----------------------------------------------------------------------------------------------------
