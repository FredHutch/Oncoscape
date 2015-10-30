# test_OncoDev14.R
# these tests create an OncoDev14 object but do not run it on a websocket port
# live websocket tests are found in testWebSocketOperations.py 
# these tests establish that all the methods of the -unconnected- OncoDev14 work properly
#----------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------
PORT = 4124
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
library(RUnit)
library(OncoDev14)
library(TCGAgbm)
  test_jsonOperations()
  test_serverVersion()
  test_loadDataPackages()
  test_loadDataPackageGeneSets()
  test_manifest()
  test_loadExpressionMatrix()
  test_loadPatientHistoryTable()
  
} # runTests

#----------------------------------------------------------------------------------------------------
runTimedTests <- function()
{
   library(rbenchmark)
   fileNameTemp <- c("test_OncoDev14_BenchMark",date())
   fileNamePaste <- paste(fileNameTemp, collapse = " ")
   fileName <- gsub("[ ]", "_", fileNamePaste)
   benchCols <-  c('test', 'replications', 'elapsed', 'relative', 'user.self', 'sys.self', 'user.child', 'sys.child')
   reps <- 1
   write(timestamp(),file=fileName, append=TRUE)
   write.table(t(benchCols), file=fileName, append=TRUE, col.names=FALSE, row.names=FALSE)
   write.table(data.frame("library(RUnit)", reps, t(c(system.time(library(RUnit))))), file=fileName, append=TRUE,
              col.names=FALSE, row.names=FALSE)
   write.table(data.frame("library(OncoDev14)", reps, t(c(system.time(library(OncoDev14))))), file=fileName, append=TRUE,
              col.names=FALSE, row.names=FALSE)
   write.table(data.frame("library(TCGAgbm)",reps, t(c(system.time(library(TCGAgbm))))), file=fileName, append=TRUE,
              col.names=FALSE, row.names=FALSE)
   write.table(benchmark(test_jsonOperations, test_serverVersion, test_loadDataPackages,
              test_loadDataPackageGeneSets,  test_manifest,
              test_loadExpressionMatrix, test_loadPatientHistoryTable,
                       replications=1000,
              columns = c('test', 'replications', 'elapsed', 'relative', 'user.self', 'sys.self', 'user.child', 'sys.child')),
              file=fileName, append=TRUE, col.names=FALSE, row.names=FALSE)

   write(timestamp(),file=fileName, append=TRUE)
}
#----------------------------------------------------------------------------------------------------
# whether our source data is a matrix, or a data.frame, we use the following convention
# to send them to the client:
#   convert all values to strings
#   convert every data.frame to matrix
#   grab the column names
# send to client like this:
#   payload=list(colnames=colnames(mtx), mtx=mtx)
# this then translates, for example, a fully typed data.frame
#         integers strings floats
#  rowOne        1     ABC  3.140
#  rowTwo        2     def  2.718
#
#  mtx <- as.matrix(mtx)
#  toJSON(list(colnames=colnames(mtx), mtx=mtx))
# {"colnames":["integers","strings","floats"],"mtx":[["1","ABC","3.140"],["2","def","2.718"]]} 
#
# for using such data with jQuery datatable, see
#    http://www.datatables.net/manual/data

test_jsonOperations <- function()
{
  print("--- test_jsonOperations")

     # how is a data.frame encoded?  start with a general example, using rownames
     # jQuery DataTable does not support rownames, so modify this to put the rownames
     # into the table as a column
  tbl <- data.frame(integers=1:2, strings=c("ABC", "def"), floats=c(3.14, 2.718),
                    stringsAsFactors=FALSE, row.names=c("rowOne", "rowTwo"))

  tbl$name <- rownames(tbl)
  preferred.columns.in.order <-  c("name", "integers", "strings", "floats")
  tbl <- tbl[,preferred.columns.in.order]
     # get rid of the rownames
  rownames(tbl) <- NULL
  checkEquals(colnames(tbl), preferred.columns.in.order)
  checkEquals(fromJSON(toJSON(tbl)), tbl)

  #print(tbl)

     # were variable types preserved?
  checkEquals(unlist(lapply(tbl, class), use.names=FALSE),
              c("character", "integer", "character", "numeric"))


} # test_jsonOperations
#----------------------------------------------------------------------------------------------------
test_serverVersion <- function()
{
  print("--- test_serverVersion, OncoDev14")
  scriptDir <- NA_character_
  userID <- "test@nowhere.net"
  datasetNames <- "DEMOdz"

  onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID, datasetNames=datasetNames)
  version <- serverVersion(onco)
  checkEquals(length(grep("^1.4", version)), 1)   # e.g., "1.4.4"

} # test_serverVersion
#----------------------------------------------------------------------------------------------------
# DEMOdz should be installed, but not yet loaded.  Oncoscape loads it on demand, which we test here
test_loadDataPackages <- function()
{
  print("--- test_loadDataPackages, OncoDev14")
  scriptDir <- NA_character_
  userID <- "test@nowhere.net"

  datasetNames <- "DEMOdz"

     # this simgle dataset name should work without trouble
  onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID, datasetNames=datasetNames)
  checkEquals(getDataSetNames(onco), datasetNames)
  
    # semicolons are the token separator.  here we request a non-existent, second  package
    # only the first one should work
  
  datasetNames <- "DEMOdz;bogus"
  suppressWarnings(onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID,
                                     datasetNames=datasetNames))
  checkEquals(getDataSetNames(onco), datasetNames)

} # test_loadDataPackages
#----------------------------------------------------------------------------------------------------
# load the DEMOdz dataset, get the manifest, check for expected values
test_manifest <- function()
{
  print("--- test_manifest, OncoDev14")
  scriptDir <- NA_character_
  userID <- "test@nowhere.net"

  dataset <- "DEMOdz"
  onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID, datasetNames=dataset)
  ds <- DEMOdz()
  tbl <- manifest(ds)
  checkEquals(colnames(tbl),  c("variable", "class", "category", "subcategory", "entity.count",
                                "feature.count", "entity.type", "feature.type", "minValue",
                                "maxValue",  "provenance"))

    # spot check a few of the more permanent members of the datasets

  checkEquals(3, length(intersect(rownames(tbl),
                                  c("mtx.mut.RData", "mtx.cn.RData", "events.RData"))))
    
} # test_manifest
#----------------------------------------------------------------------------------------------------
# get mtx.mrna, make sure it is reasonable and matched to the manifest
test_loadExpressionMatrix <- function()
{
  print("--- test_loadExpressionMatrix, OncoDev14")

  scriptDir <- NA_character_
  userID <- "test@nowhere.net"

  dataset <- "DEMOdz"
  onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID, datasetNames=dataset)
  ddz <- DEMOdz()
  tbl <- manifest(ddz)
  checkTrue("mtx.mut" %in% tbl$variable)
  checkTrue("mtx.mut" %in% names(matrices(ddz)))
  mtx.mrna <- matrices(ddz)[["mtx.mrna.ueArray"]]
  expected.rowCount <- tbl["mtx.mrna.ueArray.RData", "entity.count"]
  expected.colCount <- tbl["mtx.mrna.ueArray.RData", "feature.count"]
  checkEquals(dim(mtx.mrna), c(expected.rowCount, expected.colCount))

} # test_loadExpressionMatrix
#----------------------------------------------------------------------------------------------------
# get mtx.mrna, make sure it is reasonable and matched to the manifest
test_loadPatientHistoryTable <- function()
{
  print("--- test_loadPatientHistoryTable, OncoDev14")

  scriptDir <- NA_character_
  userID <- "test@nowhere.net"

  dataset <- "DEMOdz"
  onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID, datasetNames=dataset)
  ddz <- DEMOdz()
  tbl.history <- getPatientTable(ddz)
  checkEquals(dim(tbl.history), c (20,162))
  checkTrue(all(c("Survival", "AgeDx", "TimeFirstProgression", "ptID", "study") %in% colnames(tbl.history)))


} # test_loadPatientHistoryTable
#----------------------------------------------------------------------------------------------------
# get mtx.mrna, make sure it is reasonable and matched to the manifest
test_loadDataPackageGeneSets <- function()
{
  print("--- test_loadDataPackageGeneSets")

  dz <- TCGAgbm()
  checkTrue(all(c("marker.genes.545", "tcga.GBM.classifiers") %in% getGeneSetNames(dz)))
  x <- getGeneSetGenes(dz, "tcga.GBM.classifiers")
  checkTrue(length(x) > 200)
  checkEquals(head(sort(x), n=3), c("ABAT", "ABCD2", "ABL1"))

     # todo: demonstrate and test doing this from within Oncoscape
        

} # test_loadDataPackageGeneSets
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTimedTests()
