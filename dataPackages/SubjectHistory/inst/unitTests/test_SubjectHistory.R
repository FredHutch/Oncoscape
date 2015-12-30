library(RUnit)
library(SubjectHistory)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.defaultConstructor();
  test.constructorWithSampleHistoryTable()
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.defaultConstructor <- function()
{
   print("--- test.defaultConstructor")
   history <- SubjectHistory();
   tbl <- getTable(history)
   checkEquals(dim(tbl), c(0,0))

   checkEquals(length(getSubjectIDs(history)), 0)
   checkEquals(length(getEventNames(history)), 0)
   
} # test.defaultConstructor
#----------------------------------------------------------------------------------------------------
test.constructorWithSampleHistoryTable <- function()
{
   print("--- test.constructorWithSampleHistoryTable")
   load(system.file(package="SubjectHistory", "extdata", "sampleHistoryTable.RData"))
   history <- SubjectHistory(table=tbl);

   tbl.recovered <- getTable(history)
   checkEquals(dim(tbl.recovered), c(10,6))

   ids <- getSubjectIDs(history)
   checkEquals(length(ids), 10)
   checkEquals(head(ids, n=3), c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"))

   eventNames <- getEventNames(history)
   checkEquals(length(eventNames), 6)
   checkEquals(eventNames, c("ptNum", "study", "Birth.date", "Birth.gender", "Drug.date1", "Diagnosis.date"))

   checkEquals(dim(getTable(history, selected.subjects="TCGA.02.0014")), c(1,6))
   checkEquals(dim(getTable(history, selected.events=c("Birth.date", "Diagnosis.date"))), c(10,2))
   
} # test.constructorWithSampleHistoryTable
#----------------------------------------------------------------------------------------------------
