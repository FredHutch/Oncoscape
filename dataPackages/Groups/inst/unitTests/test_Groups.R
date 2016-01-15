library(RUnit)
library(Groups)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
Sys.setlocale("LC_ALL", "C")   # set sort order, used by some tests
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.loadFiles()
  test.constructor();
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.constructor <- function()
{
   print("--- testConstructor")
   d <- Groups()
   checkEquals(getName(d), "")
   checkEquals(nrow(getManifest(d)), 0)
   checkEquals(getItemNames(d), character(0))
   checkEquals(getSubjectHistory(d), SubjectHistory())
   
} # test.constructor
#----------------------------------------------------------------------------------------------------
test.loadFiles <- function()
{
   print("--- test.loadFiles")
   dir <- system.file(package="Groups", "extdata")
   checkTrue(file.exists(dir))
   x <- Groups:::.loadFiles(dir)
   checkEquals(x$test4, c("ELF4", "PIK3C2B", "EMP3", "PLAG1"))
   
} # test.loadFiles
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
   tbl.history <- g
   checkTrue("data.frame" %in% is(tbl.history))

} # test.getItemNamesGetItems
#----------------------------------------------------------------------------------------------------
test.getNetwork <- function()
{
   print("--- test.getNetwork")
   dz <- DEMOdz();
   network.name <- "g.markers.json"
   checkTrue(network.name %in% getManifest(dz)$variable)
   checkTrue(network.name %in% getItemNames(dz))
   g.chars <- getItemByName(dz, network.name)
   checkEquals(class(toJSON(g.chars)), "json")

} # test.getNetwork
#----------------------------------------------------------------------------------------------------
test.getSampleIdToSubjectId <- function()
{
   print("--- test.getSampleIdToSubjectId")

   dz <- DEMOdz()
   tbl.manifest <- getManifest(dz)
   matrix.names <- subset(tbl.manifest, class=="matrix")$variable
   sample <- matrix.names[1]
   mtx <- getItemByName(dz, sample)         
   sampleIDs <- rownames(mtx)   # these are also subject ids, with no sample suffix
   checkEquals(sampleIdToSubjectId(dz, sampleIDs), sampleIDs)
          
} # test.getSampleIdToSubjectId
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
