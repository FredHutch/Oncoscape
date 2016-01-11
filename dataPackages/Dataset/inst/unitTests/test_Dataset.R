library(RUnit)
library(Dataset)
library(DEMOdz)
library(jsonlite)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
Sys.setlocale("LC_ALL", "C")   # set sort order, used by some tests
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.constructor();
  #test.loadFiles()
  #test.getItemNamesGetItems()
  #test.getNetwork()
  #test.getSampleIdToSubjectId()
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.constructor <- function()
{
   print("--- testConstructor")
   d <- Dataset();
   checkEquals(getName(d), "")
   checkEquals(nrow(getManifest(d)), 0)
   checkEquals(getItemNames(d), character(0))
   checkEquals(getSubjectHistory(d), SubjectHistory())
   
} # test.constructor
#----------------------------------------------------------------------------------------------------
test.loadFiles <- function()
{
   print("--- test.loadFiles")
   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   full.path <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(full.path))
   tbl.manifest <- read.table(full.path, sep="\t", header=TRUE, as.is=TRUE)
   
   x <- Dataset:::.loadFiles(dir, tbl.manifest)

       # check some gross features.  some knowledge of DEMOdz's actual data is used
   expected.names <- c("mtx.mut", "mtx.cn", "mtx.mrna.ueArray")
   checkTrue(all(expected.names %in% ls (x)))

   checkEquals(nrow(x$mtx.cn), 20)
   
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
