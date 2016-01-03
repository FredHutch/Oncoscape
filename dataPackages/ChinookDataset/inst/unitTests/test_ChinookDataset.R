library(RUnit)
library(ChinookDataset)
library(ChinookServer)
library(DEMOdz)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
   test.noDatasetConstructor();
   test.datasetConstructor()
   #test.getItemByName()

} # runTests
#----------------------------------------------------------------------------------------------------
test.noDatasetConstructor <- function()
{
   print("--- test.noDatasetConstructor")
   ca <- ChinookDataset("test")
   server <- ChinookServer()
   setServer(ca, server)
   checkEquals(getName(ca), "test")
   checkEquals(getServer(ca), server)
   
   ca2 <- ChinookDataset("test2")   # also an empty server
   checkEquals(getName(ca2), "test2")
   checkTrue(is.na(getServer(ca2)))
   
} # test.noDatasetConstructor
#----------------------------------------------------------------------------------------------------
test.datasetConstructor <- function()
{
   print("--- test.datasetConstructor")
   dz <- DEMOdz()
   cds <- ChinookDataset("DEMOdz", dz)
   server <- ChinookServer()
   setServer(cds, server)
   checkEquals(getName(cds), "DEMOdz")
   checkEquals(getServer(cds), server)
   dz2 <- getDataset(cds)
   checkIdentical(dz, dz2)
   
} # test.datasetConstructor
#----------------------------------------------------------------------------------------------------
test.getItemByName <- function()
{
   print("--- test.datasetConstructor")
   dz <- DEMOdz()
   cds <- ChinookDataset("DEMOdz", dz)
   dz.vars <- getItemNames(cds)
   checkTrue("character" %in% is(dz.vars))
   checkTrue(length(dz.vars) > 10)               # found 18 on (3 jan 2016)
   checkTrue(length(grep("^mtx", dz.vars)) > 3)  # found  6 on (3 jan 2016)

} # test.getItemByName
#----------------------------------------------------------------------------------------------------
test.getItemByName <- function()
{
   print("--- test.datasetConstructor")
   dz <- DEMOdz()
   cds <- ChinookDataset("DEMOdz", dz)
   server <- ChinookServer()
   setServer(cds, server)
   checkEquals(getName(cds), "DEMOdz")
   checkEquals(getServer(cds), server)
   
  
    
} # test.datasetConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
