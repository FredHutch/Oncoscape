addRMessageHandler("initUserDataStore", "initUserDataStore");
addRMessageHandler("getUserDataStoreSummary", "getUserDataStoreSummary");
addRMessageHandler("userDataStoreAddData", "userDataStoreAddData");
addRMessageHandler("userDataStoreDeleteDataItem", "userDataStoreDeleteDataItem");
addRMessageHandler("userDataStoreGetDataItem", "userDataStoreGetDataItem");
#----------------------------------------------------------------------------------------------------
initUserDataStore <- function(msg)
{
   uds <- payloadToUserDataStoreInstance(msg$payload)

   entry.count <- nrow(getSummary(uds))
   return.msg <- list(cmd=msg$callback, status="success", callback="", payload=entry.count);

   toJSON(return.msg)

} # initUserDataStore
#----------------------------------------------------------------------------------------------------
getUserDataStoreSummary <- function(msg)
{
   uds <- payloadToUserDataStoreInstance(msg$payload)
   tbl <- getSummary(uds)
   mtx <- as.matrix(tbl)

   payload <- list(colnames=colnames(tbl), tbl=mtx)

   return.msg <- list(cmd=msg$callback, status="success", callback="", payload=payload)

   toJSON(return.msg)

} # getUserDataStoreSummary
#----------------------------------------------------------------------------------------------------
userDataStoreAddData <- function(msg)
{
  printf("--- entering userDataStoreAddDate");
  print(msg);
  
  payload <- msg$payload
      # payload has dataItem info (the data itself, group, name, permissions, tabs)
      # but includes the userID, userGroups and repoRoot needed to create an
      # instance of the UserDataSTore
   expected.fields <- c("userID", "userGroups", "dataItem", "name",
                        "permissions", "tags")
   missing.fields <- setdiff(expected.fields, names(payload))
   if(length(missing.fields) > 0){
      printf("names(payload): %s", paste(names(payload), collapse=":"))
      msg <- sprintf("userDataStoreAddData detected missing payload fields: '%s'",
                     paste(missing.fields, collapse=", "))
      stop(msg);
     #stopifnot(all(expected.fields %in% names(payload)))
     } # if missing.fields
   
   uds <- payloadToUserDataStoreInstance(msg$payload)
   dataItem <- payload$dataItem
   name <- payload$name
   groups <- payload$userGroups
   permissions <- payload$permissions
   tags <- payload$tag

   addData(uds, dataItem, name, group, permissions, tags)

   entry.count <- nrow(getSummary(uds))
   return.msg <- list(cmd=msg$callback, status="success", callback="", payload=entry.count)
   print("=== userDataStoreAddData issuing callback");
   print(return.msg)
  
   toJSON(return.msg)

} # userDataStoreAddData
#----------------------------------------------------------------------------------------------------
userDataStoreGetDataItem <- function(msg)
{
  payload <- msg$payload
  
      # payload has dataItem info (the data itself, group, name, permissions, tabs)
      # but includes the userID, userGroups and repoRoot needed to create an
      # instance of the UserDataSTore
   expected.fields <- c("userID", "userGroups", "dataItemName")
   stopifnot(all(expected.fields %in% names(payload)))
   
   uds <- payloadToUserDataStoreInstance(msg$payload)
   tbl.summary <- getSummary(uds)
   target <- payload$dataItemName

   if(!target %in% tbl.summary$file){
      return.msg <- list(cmd=msg$callback, status="error", callback="",
                         payload=sprintf("wsUserDataStore, no item named '%s' to delete", target))
      toJSON(return.msg)
      return;
      }

   dataItem <- getDataItem(uds, target)
   payload <- list(value=dataItem, count=length(dataItem), source="userDataStore")
   return.msg <- list(cmd=msg$callback, status="success", callback="",
                      payload=payload)

   toJSON(return.msg)

} # userDataStoreGetDataItem
#----------------------------------------------------------------------------------------------------
userDataStoreDeleteDataItem <- function(msg)
{
  payload <- msg$payload
  
      # payload has dataItem info (the data itself, group, name, permissions, tabs)
      # but includes the userID, userGroups and repoRoot needed to create an
      # instance of the UserDataSTore
   expected.fields <- c("userID", "userGroups", "dataItemName")
   stopifnot(all(expected.fields %in% names(payload)))
   
   uds <- payloadToUserDataStoreInstance(msg$payload)
   tbl.summary <- getSummary(uds)
   target <- payload$dataItemName

   if(!target %in% tbl.summary$file){
      return.msg <- list(cmd=msg$callback, status="error", callback="",
                         payload=sprintf("wsUserDataStore, no item named '%s' to delete", target))
      toJSON(return.msg)
      return;
      }

   deleteDataItem(uds, target)
   return.msg <- list(cmd=msg$callback, status="success", callback="",
                      payload=sprintf("'%s' deleted", target))

   print(return.msg)
  
   toJSON(return.msg)

} # userDataStoreDeleteDataItem
#----------------------------------------------------------------------------------------------------
# find userID, userGroups, and repoRoot in the fields of a payload,
# parse them out, check them, create and return a UserDataStore instance
payloadToUserDataStoreInstance <- function(payload)
{
   expected.fields <- c("userID", "userGroups")
   legalPayload <- all(expected.fields %in% names(payload))
   if(!legalPayload){
      missing.fields <- setdiff(expected.fields, names(payload))
      msg <- sprintf("payload missing fields: %s", paste(missing.fields, collapse=", "))
      stop(msg)
      }

   userID <- payload$userID
   userGroups <- as.list(payload$userGroups)
   #repoRoot <- payload$repoRoot
   #uri <- sprintf("file://%s", repoRoot);

   UserDataStore(userID, userGroups)

} # payloadToUserDataStoreInstance
#----------------------------------------------------------------------------------------------------

