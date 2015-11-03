library(RUnit)
library(PatientHistory)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.constructor();
  test.geteventList();
  test.getTable();
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.constructor <- function()
{
   print("--- test.constructor")
   ph <- PatientHistory();
   checkEquals(eventCount(ph), 0)
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
test.geteventList <- function()
{
   print("--- test.geteventList")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))
   x <- SttrDataPackage:::.loadFiles(dir)
   expected.names <- c("manifest", "matrices", "data.frames", "history", "genesets", "networks",
                       "sampleCategorizations")
   checkTrue(all(expected.names %in% names(x)))

   list.events <- geteventList(x$history)
   checkEquals(class(list.events), "list")
   checkEquals(length(list.events), 201)
   checkEquals(list.events[[12]],
               list(PatientID="TCGA.06.0201", PtNum=369, study="TCGAgbm", Name="Birth",
                    Fields=list(date="12/11/1943", gender="female",
                                race="white", ethnicity="not hispanic or latino")))

} # test.getList
#----------------------------------------------------------------------------------------------------
test.getTable <- function()
{
   print("--- test.getTable")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))
   x <- SttrDataPackage:::.loadFiles(dir)

   tbl <- getTable(x$history)
   checkEquals(class(tbl), "data.frame")
   checkEquals(dim(tbl), c(20, 162))
   checkEquals(colnames(tbl)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))

   checkEquals(unique(tbl$study), "TCGAgbm")
   checkEquals(tbl["TCGA.02.0014","Survival"], 2512)
   checkEquals(tbl["TCGA.02.0014", "AgeDx"], 9369)
   checkEquals(tbl["TCGA.02.0014", "TimeFirstProgression"], 2243)


   checkEquals(as.character(tbl[2,1]),  "TCGA.02.0021")
   
   tbl <- getTable(x$history, patient.ids=c("TCGA.06.0201","TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"))
   checkEquals(class(tbl), "data.frame")
   checkEquals(dim(tbl), c(4, 162))
   checkEquals(as.character(tbl[1,1]), "TCGA.06.0201")

   tbl <- getTable(x$history, selectCols=c("Survival", "AgeDx", "TimeFirstProgression"))
   checkEquals(class(tbl), "data.frame")
   checkEquals(dim(tbl), c(20, 3))
   checkEquals(as.character(tbl[1,]),c("2512", "9369", "2243"))


} # test.getTable
#----------------------------------------------------------------------------------------------------
test.getpatientList <- function()
{
   print("--- test.getpatientList")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))
   x <- SttrDataPackage:::.loadFiles(dir)

   list.pts <- PatientHistory::getpatientList(x$history)
   checkEquals(class(list.pts), "list")
   checkEquals(length(list.pts), 20)
   checkEquals(names(list.pts[[1]]), c("dateEvents", "noDateEvents"))
   checkEquals(length(list.pts[[12]]$dateEvents),4)
   checkEquals(order(list.pts[[12]]$dateEvents$date),1:4)

   
}
#----------------------------------------------------------------------------------------------------
test.geteventTypeList <- function()
{
   print("--- test.getpatientList")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))
   x <- SttrDataPackage:::.loadFiles(dir)

   list.pts <- PatientHistory::getpatientList(x$history)
   checkEquals(class(list.pts), "list")
   checkEquals(length(list.pts), 20)
   checkEquals(names(list.pts[[1]]), c("dateEvents", "noDateEvents"))
   checkEquals(length(list.pts[[12]]$dateEvents),4)
   checkEquals(order(list.pts[[12]]$dateEvents$date),1:4)

   
}
#----------------------------------------------------------------------------------------------------
test.getDateDifference <- function()
{
   print("--- test.getDateDiff")
   
   x<- PatientHistory:::getDateDifference(date1="1/1/2002", date2="5/18/2002")
   checkEquals(137, x)

   x<- PatientHistory:::getDateDifference(date1="1/1/2002", date2=c("5/18/2002","1/1/2002","1/1/2009"), instance2=2)
   checkEquals(137, x)

   x<- PatientHistory:::getDateDifference(date1=c("1/1/2002","3/1/2002"), date2=c("5/18/2002","1/1/2002","1/1/2009"), instance1=2)
   checkEquals(-59, x)
   
   x<- PatientHistory:::getDateDifference(date1=c("5/1/2002","3/1/2002", "12/15/2009"), date2=c("5/18/2002","7/1/2002","1/1/2009"), instance2="linked")
   checkEquals(122, x)
   
}
#----------------------------------------------------------------------------------------------------
test.addCalculatedEvents <- function()
{
   print("--- test.addCalculatedEvents")
   
     dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))
   x <- SttrDataPackage:::.loadFiles(dir)

    checkTrue(all(c("Survival", "AgeDx", "TimeFirstProgression") %in% colnames(getTable(x$history))))
}
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
