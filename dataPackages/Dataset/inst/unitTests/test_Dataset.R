library(RUnit)
library(Dataset)
library(DEMOdz)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.constructor();
  test.loadFiles()
  test.getSubjectHistoryList()
  test.getSubjectHistoryTable()
  test.getGeneSets()
  test.getItemNamesGetItems()
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.constructor <- function()
{
   print("--- testConstructor")
   dp <- Dataset();
   checkEquals(length(matrices(dp)), 0)
   checkEquals(nrow(manifest(dp)), 0)
   sh <- history(dp)
   checkEquals(class(history(dp))[1], "data.frame")
   #checkEquals(class(history(dp))[1], "SubjectHistory")
   #checkEquals(nrow(getTable(history(dp))), 0)
   checkEquals(nrow(history(dp)), 0)
   
} # test.constructor
#----------------------------------------------------------------------------------------------------
test.loadFiles <- function()
{
   print("--- test.loadFiles")
   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))
   x <- Dataset:::.loadFiles(dir)

       # check some gross features.  some knowledge of DEMOdz's actual data is used
   expected.names <- c("data.frames", "genesets", "history", "manifest", "matrices", "networks")

   checkTrue(all(expected.names %in% names(x)))
   checkEquals(ncol(x$manifest), 11)
   checkTrue(nrow(x$manifest) >= 10)

     # more will likely be added over time
   expected.variables <- c("mtx.mrna.ueArray", "mtx.mrna.bc", "mtx.mut", "mtx.cn", "history",
                           "tbl.ptHistory", "mtx.prot", "mtx.meth", "genesets", "g.markers.json")

   checkTrue(all(expected.variables %in% x$manifest$variable))
   
   expected.classes <- c("data.frame", "list", "matrix", "character", "json")
   checkTrue(all(x$manifest$class %in% expected.classes))

   checkTrue(length(x$matrices) > 4)
   checkTrue(length(x$data.frames) > 0)
   #checkTrue(eventCount(x$history) > 100);
   checkTrue(length(x$genesets) > 1)

      # now spot check some finer details.  first, the expression matrix
   checkEquals(x$manifest$variable[1], "mtx.mrna.ueArray")
   checkEquals(head(rownames(x$matrices[[1]]), n=3), c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"))
   checkEquals(head(colnames(x$matrices[[1]]), n=3), c("EDIL3", "EED", "EEF2"))
   checkEqualsNumeric(x$manifest$minValue[1], min(x$matrices[[1]]), tolerance=1e-6)
   checkEqualsNumeric(x$manifest$maxValue[1], max(x$matrices[[1]]), tolerance=1e-6)

      # now the patient history, a list of 111 events
   checkTrue("history" %in% x$manifest$variable)
     # an arbitrary choice of history event 12
   #checkEquals(geteventList(x$history)[[12]], list(PatientID="TCGA.06.0201", PtNum=369, study="TCGAgbm", Name="Birth", Fields=list(date="12/11/1943", gender="female", race="white", ethnicity="not hispanic or latino")))
   
} # test.loadFiles
#----------------------------------------------------------------------------------------------------
test.loadTables <- function()
{
   print("--- test.loadFiles")
   dir <- system.file(package="iDEMOdz", "extdata")
   checkTrue(file.exists(dir))
   checkTrue(file.exists(file.path(dir, "manifest.tsv")))

   credentials <- list(user="oncotest", password="password")
   stopifnot(all(c("user", "password") %in% names(credentials)))
   db <- odbcConnect("iDEMOdz", uid = credentials$user, pwd = credentials$password)
   x <- Dataset:::.loadTables(dir, db)

       # check some gross features.  some knowledge of DEMOdz's actual data is used
   checkEquals(sort(names(x)),
               c("data.frames", "genesets", "history", "manifest", "matrices", "networks"))
   checkEquals(dim(x$manifest), c(10,11))
   checkEquals(x$manifest$variable,
               c("mtx.mrna.ueArray", "mtx.mrna.bc", "mtx.mut", "mtx.cn", "history", "ptList", "catList",
                 "tbl.ptHistory", "mtx.prot", "mtx.meth", "genesets", "g.markers.json"))

   checkEquals(x$manifest$class, 
               c("matrix", "matrix", "matrix", "matrix", "list", "list", "list", "data.frame", "matrix", 
                 "matrix", "list", "character"))

   checkEquals(length(x$matrices), 6)
   checkEquals(length(x$data.frames), 1)
   checkEquals(eventCount(x$history), 201)
   checkEquals(length(x$genesets), 3)

      # now spot check some finer details.  first, the expression matrix
   checkEquals(x$manifest$variable[1], "mtx.mrna.ueArray")
   checkEquals(head(rownames(x$matrices[[1]]), n=3), c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"))
   checkEquals(head(colnames(x$matrices[[1]]), n=3), c("EDIL3", "EED", "EEF2"))
   checkEqualsNumeric(x$manifest$minValue[1], min(x$matrices[[1]]), tolerance=1e-6)
   checkEqualsNumeric(x$manifest$maxValue[1], max(x$matrices[[1]]), tolerance=1e-6)

      # now the patient history, a list of 111 events
   checkTrue("history" %in% x$manifest$variable)
     # an arbitrary choice of history event 12
   checkEquals(geteventList(x$history)[[12]], list(PatientID="TCGA.06.0201", PtNum=369, study="TCGAgbm", Name="Birth", Fields=list(date="12/11/1943", gender="female", race="white", ethnicity="not hispanic or latino")))


}
#----------------------------------------------------------------------------------------------------
test.getSubjectHistoryList <- function()
{
   print("--- test.getPatientList: temporarily disabled")
   dp <- DEMOdz();

   # x <- gaetSubjectHistoryList(dp)
   # checkEquals(class(x), "list")
   # checkEquals(length(x), 20)
   # dateEvents = x[[12]]$dateEvents; rownames(dateEvents) = 1:4
   # print(dateEvents)
   # checkEquals(dateEvents$name,c("Birth", "Diagnosis", "Pathology", "Status"))
   # checkEquals(dateEvents$date,as.Date(c("1943-12-11", "1995-01-01", "1995-01-01", "1995-01-13"), format="%Y-%m-%d"))
   # checkEquals(dateEvents$eventOrder,c("single","single","single","single"))
   # checkEquals(dateEvents$eventID,c("event12", "event71", "event182", "event93"))
   # checkEquals(x[[12]]$noDateEvents,data.frame(name=c("Encounter", "Encounter"), eventID=c("event151", "event152")))

} # test.getSubjectHistoryList
#----------------------------------------------------------------------------------------------------
test.getSubjectHistoryTable <- function()
{
   print("--- test.getSubjectHistoryTable")
   dp <- DEMOdz();
   #tbl.subjectHistory <- getTable(history(dp))
   tbl.subjectHistory <- history(dp)
   checkEquals(class(tbl.subjectHistory), "data.frame")
   checkEquals(nrow(tbl.subjectHistory), 20)

} # test.getSubjectHistoryTable
#----------------------------------------------------------------------------------------------------
test.getGeneSets <- function()
{
   print("--- test.getGeneSets")
   dz <- DEMOdz();

   names <- getGeneSetNames(dz)
   checkEquals(sort(names), c("random.24", "random.40", "test4"))
   genes.24 <- getGeneSetGenes(dz, "random.24")

} # test.getGeneSets
#----------------------------------------------------------------------------------------------------
test.getItemNamesGetItems <- function()
{
   print("--- test.getItemNamesGetItems")
   dz <- DEMOdz();

   names <- getItemNames(dz)
   checkTrue(length(names) > 8)
   checkTrue("sampleJSON" %in% names)
   checkTrue("mtx.cn" %in% names)
   checkTrue("matrix" %in% is(getItemByName(dz, "mtx.cn")))
   checkTrue("json" %in% is(getItemByName(dz, "sampleJSON")))
   #checkTrue("data.frame" %in% is(getItemByName(dz, "tbl.ptHistory")))
      # the SubjectHistory 
   tbl.history <- getItemByName(dz, "tbl.ptHistory")
   checkTrue("data.frame" %in% is(tbl.history))

} # test.getItemNamesGetItems
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
