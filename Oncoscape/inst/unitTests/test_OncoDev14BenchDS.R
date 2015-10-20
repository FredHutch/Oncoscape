# test_OncoDev14BenchDS.R
# These are a set of timed tests to benchmark various component functions in Oncoscape
#----------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------
PORT = 4124

datasets <- new.env(parent=emptyenv())
#----------------------------------------------------------------------------------------------------
runAllDatasetTests <- function()
{
   library(rbenchmark)

   fileNameTemp <- c("test_OncoDev14_BenchMark_DS",date())
   fileNamePaste <- paste(fileNameTemp, collapse = " ")
   fileName <- gsub("[ ]", "_", fileNamePaste)
   fileName <- gsub("[:]", "_", fileName)
   write(timestamp(),file=fileName, append=TRUE)
# May use the datasetList in the future
   test <- "library(RUnit)"  
   replications <- 1
   datasetList <- c("TCGAbrain","DEMOdz","TCGAgbm","TCGAlgg")
   df1 <- data.frame(test, replications, t(c(system.time(library(RUnit)))))

   write.table(df1, sep=",",  file=fileName, append=TRUE, col.names=TRUE, row.names=FALSE)
   df1 <- runDsTests("DEMOdz")
   print(df1)
   write.table(df1, sep=",",  file=fileName, append=TRUE, col.names=FALSE, row.names=FALSE)

   df1 <- runDsTests("TCGAgbm")
   write.table(df1, sep=",",  file=fileName, append=TRUE, col.names=FALSE, row.names=FALSE)

   df1 <- runDsTests("TCGAlgg")
   write.table(df1, sep=",",  file=fileName, append=TRUE, col.names=FALSE, row.names=FALSE)

   df1 <- runDsTests("TCGAbrain")
   write.table(df1, sep=",",  file=fileName, append=TRUE, col.names=FALSE, row.names=FALSE)
   
   
}



#----------------------------------------------------------------------------------------------------
runDsTests <- function(datasetName)
{

   replications <- 1
   datasets[["currentDatasetName"]] <- datasetName
   test <- "library(RUnit)"  
   dfLocal <- data.frame(test, replications, t(c(system.time(library(RUnit)))))
#   print(dfLocal)
   test <- "library(OncoDev14)"
   dfLocal <- rbind(dfLocal, data.frame(test, replications, t(c(system.time(library(OncoDev14 ))))))
#   print(dfLocal)
   exp <- sprintf("t(c(system.time(library(%s))))", datasetName)
   test <- sprintf("library(%s)", datasetName)
   dfLocal <- rbind(dfLocal, data.frame(test, replications, eval(parse(text=exp))))
#   print(dfLocal)
# Save instance of dataset constructor for use later
        expression <- sprintf("ds <- %s()", datasetName)
        eval(parse(text=expression))
        datasets[[datasetName]] <- ds
   

   dfLocal <- rbind(dfLocal, evalTestFunc("test_requireForDataSet", datasetName, replications)) 
   dfLocal <- rbind(dfLocal, evalTestFunc("test_ctorForDataSet", datasetName, replications))
   replications = 1000
   dfLocal <- rbind(dfLocal, evalTestFunc("test_manifest", datasetName, replications))
   dfLocal <- rbind(dfLocal, evalTestFunc("test_loadPatientHistoryTable", datasetName, replications))
#   dfLocal <- rbind(dfLocal, evalTestFunc("test_loadDataPackageGeneSets", datasetName, replications))
   dfLocal <- rbind(dfLocal, evalTestFunc("test_getHistory", datasetName, replications))
   dfLocal <- rbind(dfLocal, evalTestFunc("test_getEventList", datasetName, replications))
   dfLocal <- rbind(dfLocal, evalTestFunc("test_getEventTypeList", datasetName, replications))
   dfLocal <- rbind(dfLocal, evalTestFunc("test_getPatientTable", datasetName, replications))
   dfLocal <- rbind(dfLocal, evalTestFunc("test_Matrices", datasetName, replications))
         
   dfLocal
}
#---------------------------------------------------------------------------------------------------
evalTestFunc <- function(testName, dataSetName, replications, const)
{
   exp <- sprintf("%s('%s')", testName, dataSetName)
   dfLocal <- benchmark(eval(parse(text=exp)), replications=replications,
              columns = c('replications','user.self','sys.self','elapsed','user.child','sys.child'))
#Need to replace the test value, bind above takes care of the ordering
   dfLocal$test <- testName
   dfLocal

}
#---------------------------------------------------------------------------------------------------
test_ctorForDataSet <- function(dataSetName)
{

        expression <- sprintf("p <- %s()", dataSetName)
        tryCatch(eval(parse(text=expression)),
                                error=function(e)
                                message(sprintf("failure calling constructor for '%s'", dataSetName)))
}

#---------------------------------------------------------------------------------------------------
test_requireForDataSet <- function(dataSetName)
{
     expression <- sprintf("require(%s, quietly=TRUE)", dataSetName)
     tryCatch(eval(parse(text=expression)), error=function(e) {
        message(sprintf("failed to load dataset '%s'", dataSetName))
        })
}

#----------------------------------------------------------------------------------------------------
# load the TCGAbrain dataset, get the manifest, check for expected values
test_manifest <- function(datasetName)
{

  tbl <- manifest(datasets[[datasetName]])


    
} # test_manifest

#----------------------------------------------------------------------------------------------------
# get mtx.mrna, make sure it is reasonable and matched to the manifest
test_loadPatientHistoryTable <- function(datasetName)
{

  tbl.history <- getPatientTable(datasets[[datasetName]])

} # test_loadPatientHistoryTable
#----------------------------------------------------------------------------------------------------
# get mtx.mrna, make sure it is reasonable and matched to the manifest
test_loadDataPackageGeneSets <- function(datasetName)
{

  x <- getGeneSetGenes(datasets[[datasetName]])
        
} # test_loadDataPackageGeneSets
#----------------------------------------------------------------------------------------------------
test_getHistory <- function(datasetName)
{

  hist <- history(datasets[[datasetName]])

} # test_getHistory
#----------------------------------------------------------------------------------------------------
test_getEventList <- function(datasetName)
{

  evl <- getEventList(datasets[[datasetName]])

} # test_getEventList
#----------------------------------------------------------------------------------------------------
test_getEventTypeList <- function(datasetName)
{

  evtl <- getEventTypeList(datasets[[datasetName]])


} # test_getEventTypeList
#----------------------------------------------------------------------------------------------------
test_getPatientTable <- function(datasetName)
{

  pt <- getPatientTable(datasets[[datasetName]])

} # test_getPatientTable
#----------------------------------------------------------------------------------------------------
test_Matrices <- function(datasetName)
{

  mat <- matrices(datasets[[datasetName]])

}
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runAllDatasetTests()
