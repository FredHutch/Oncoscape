# test_UserDataStore.R
#----------------------------------------------------------------------------------------------------
library(RUnit)
library(OncoDev14)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
   test_defaultConstructor()
   test_constructor()
   test_.deduceNextAvailableFileNumber()
   test_addData()
   test_addData_3items()
   test_getSummary()
   test_getDataItem()
   test_deleteItem()
   
} # runTests
#----------------------------------------------------------------------------------------------------
test_defaultConstructor <- function()
{
   print("--- test_defaultConstructor, UserDataStore")
   uds <- UserDataStore()
   checkTrue(is.na(getUserID(uds)))
   checkEquals(getUserGroups(uds), list())
   checkEquals(getURI(uds), Sys.getenv("ONCOSCAPE_USER_DATA_STORE"))
   checkTrue(is.na(getUserDirectory(uds)))
    
} # test_defaultConstructor
#----------------------------------------------------------------------------------------------------
test_constructor <- function()
{
   print("--- test_constructor, UserDataStore")
   userID <- "test@nowhere.net"
   userGroups <- list("public", "test")
   uri <- Sys.getenv("ONCOSCAPE_USER_DATA_STORE")
   repoRoot <-  sub("file://", "", uri)

      # test with a blank slate: no previous directory, no files
   user.data.dir <- file.path(repoRoot, userID)
   .deleteUserDataStore(user.data.dir)
   
   uds <- UserDataStore(userID, userGroups)

   checkEquals(getUserID(uds), userID)
   checkEquals(getUserGroups(uds), userGroups)
   checkEquals(getURI(uds), uri)
   checkEquals(getUserDirectory(uds), sprintf("%s/%s", repoRoot, userID))
   checkTrue(file.exists(getUserDirectory(uds)))
   metadata.filename <- file.path(getUserDirectory(uds), "metadata.RData")
   checkTrue(file.exists(metadata.filename))
   
} # test_constructor
#----------------------------------------------------------------------------------------------------
test_.deduceNextAvailableFileNumber <- function()
{
   print("--- test_.deduceNextAvailableFileNumber, UserDataStore")

     # need to set this up with 0 files, and then some files
   userID <- "test@nowhere.net"
   userGroups <- list("public", "test")
   uri <- Sys.getenv("ONCOSCAPE_USER_DATA_STORE")
   repoRoot <-  sub("file://", "", uri)
   user.data.dir <- file.path(repoRoot, userID)
   
     # guarantee a fresh slate
   .deleteUserDataStore(user.data.dir)

   uds <- UserDataStore(userID, userGroups)
   checkEquals(list.files(user.data.dir), "metadata.RData")
   
   nextNumber <- OncoDev14:::.deduceNextAvailableFileNumber(getUserDirectory(uds))
   checkEquals(nextNumber, 1)

      # now add some data
   dataItem <- 1:100
   name <- "oneToHundred"
   group <-"public"
   permissions <- 444;
   tags <- c("numbers", "test data")
   addData(uds, dataItem, name, group, permissions, tags)
   
   nextNumber <- OncoDev14:::.deduceNextAvailableFileNumber(getUserDirectory(uds))
   checkEquals(nextNumber, 2)

      # try it again
   nextNumber <- OncoDev14:::.deduceNextAvailableFileNumber(getUserDirectory(uds))
   checkEquals(nextNumber, 2)

} # test_.deduceNextAvailableFileNumber
#----------------------------------------------------------------------------------------------------
test_addData <- function()
{
   print("--- test_addData, UserDataStore")

   userID <- "test@nowhere.net"
   userGroups <- list("public", "test")

   uri <- Sys.getenv("ONCOSCAPE_USER_DATA_STORE")
   repoRoot <-  sub("file://", "", uri)

      # test with a blank slate: no previous directory, no files
   user.data.dir <- file.path(repoRoot, userID)

   .deleteUserDataStore(user.data.dir)
   
   uds <- UserDataStore(userID, userGroups)

   dataItem <- 1:10
   name <- "oneToTen"
   group <-"public"
   permissions <- 444;
   tags <- c("numbers", "test data")
   addData(uds, dataItem, name, group, permissions, tags)

   metadata.filename <- file.path(getUserDirectory(uds), "metadata.RData")
   checkTrue(file.exists(metadata.filename))
   load(metadata.filename)
   checkEquals(dim(tbl), c(1,7))
   checkEquals(as.list(tbl[1,c(1,2,3,4,6,7)]),   # leave out the created time
               list(file="data0001",
                    name="oneToTen",
                    user="test@nowhere.net",
                    group="public;test",
                    permissions=444,
                    tags="numbers;test data"))

   first.data.filename <- file.path(getUserDirectory(uds), "data0001.RData")
   checkTrue(file.exists(first.data.filename))
   load(first.data.filename)
   checkEquals(dataItem, 1:10)
   
   
} # test_addData
#----------------------------------------------------------------------------------------------------
test_addData_3items <- function(is.helper.to.other.test=FALSE)
{
   if(!is.helper.to.other.test)
      print("--- test_addData_3items, UserDataStore")

   userID <- "test@nowhere.net"
   userGroups <- list("public", "test")

   uri <- Sys.getenv("ONCOSCAPE_USER_DATA_STORE")
   repoRoot <-  sub("file://", "", uri)

      # test with a blank slate: no previous directory, no files
   user.data.dir <- file.path(repoRoot, userID)
   .deleteUserDataStore(user.data.dir)

   uds <- UserDataStore(userID, userGroups)

   dataItem <- 1:10
   name <- "oneToTen"
   group <-"public"
   permissions <- 444;
   tags <- c("numbers", "test data")
   addData(uds, dataItem, name, group, permissions, tags)
   addData(uds, c("TP53", "MYC"), "oncogenes", group, permissions, "candidate genes; oncogenes")
   addData(uds, c("TCGA.02.0001", "TCGA.02.0002", "TCGA.06.0175"), "long survivors", group, 400, "long survivors; GBM patients")

   metadata.filename <- file.path(getUserDirectory(uds), "metadata.RData")
   checkTrue(file.exists(metadata.filename))
   load(metadata.filename)
   checkEquals(dim(tbl), c(3,7))

   file3 <- file.path(user.data.dir, "data0003.RData")
   checkTrue(file.exists(file3))
   load(file3)
   checkEquals(dataItem, c("TCGA.02.0001", "TCGA.02.0002", "TCGA.06.0175"))

   if(is.helper.to.other.test)
      invisible(uds)

} # test_addData_3items
#----------------------------------------------------------------------------------------------------
test_getSummary <- function(is.helper.to.other.test=FALSE)
{
   print("--- test_readMetadata, UserDataStore");

   userID <- "test@nowhere.net"
   userGroups <- list("public", "test")
   uri <- Sys.getenv("ONCOSCAPE_USER_DATA_STORE")
   repoRoot <-  sub("file://", "", uri)

   .deleteUserDataStore(file.path(repoRoot, userID))

   uds <- UserDataStore(userID, userGroups)
   tbl <- getSummary(uds)
   checkEquals(dim(tbl), c(0,7))
   checkEquals(colnames(tbl),
               c("file", "name", "user", "group", "created", "permissions", "tags"))
   
   dataItem <- 1:10
   name <- "oneToTen"
   group <-"public"
   permissions <- 444;
   tags <- c("numbers", "test data")
   addData(uds, dataItem, name, group, permissions, tags)
   addData(uds, c("TP53", "MYC"), "oncogenes", group, permissions, "candidate genes; oncogenes")
   addData(uds, c("TCGA.02.0001", "TCGA.02.0002", "TCGA.06.0175"), "long survivors", group, 400, "long survivors; GBM patients")

   tbl <- getSummary(uds)
   checkEquals(dim(tbl), c(3,7))
   checkEquals(tbl$name, c("oneToTen", "oncogenes", "long survivors"))

   if(is.helper.to.other.test)
      return(tbl)

} # test_getSummary
#----------------------------------------------------------------------------------------------------
test_getDataItem <- function()
{
   print("--- test_getDataItem, UserDataStore");
   test_addData_3items(is.helper.to.other.test=TRUE)
   tbl <- test_getSummary(is.helper.to.other.test=TRUE)
   checkTrue(nrow(tbl) > 0)
   
   userID <- "test@nowhere.net"
   userGroups <- list("public", "test")
   uds <- UserDataStore(userID, userGroups)
   x <- getDataItem(uds, tbl$file[1])
   checkEquals(tbl$name[1], "oneToTen")
   checkEquals(x, 1:10)

} # test_getDataItem
#----------------------------------------------------------------------------------------------------
test_deleteItem <- function()
{
  print("--- test_deleteItem")
  uds <- test_addData_3items(is.helper.to.other.test=TRUE)
  tbl <- getSummary(uds)
  checkEquals(nrow(tbl), 3)

  target = "data0002"
  checkTrue(target %in% tbl$file)

  target.file <- file.path(getUserDirectory(uds), sprintf("%s.RData", target))
  checkTrue(file.exists(target.file))

  checkTrue(deleteDataItem(uds, target))
  
  tbl <- getSummary(uds)
  checkEquals(nrow(tbl), 2)
  checkTrue(!target %in% tbl$file)
  checkTrue(!file.exists(target.file))

    #------------------------------------------------------------
    # try to delete a non-existent item
    #------------------------------------------------------------
    
  target = "bogusTarget"
  checkTrue(!target %in% tbl$file)

  target.file <- file.path(getUserDirectory(uds), sprintf("%s.RData", target))
  checkTrue(!file.exists(target.file))
  checkTrue(!deleteDataItem(uds, target))


} # test_deleteItem
#----------------------------------------------------------------------------------------------------
# for local use only, within this unitTest file
#
.deleteUserDataStore <- function(user.data.dir)
{
   unlink(user.data.dir, recursive=TRUE, force=TRUE)

} # .deleteUserDataStore
#----------------------------------------------------------------------------------------------------
runTests()
