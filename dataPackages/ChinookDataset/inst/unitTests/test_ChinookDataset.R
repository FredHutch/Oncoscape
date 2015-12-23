library(RUnit)
library(ChinookDataset)
library(DEMOdz)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
   test.noDatasetConstructor();
   #test.datasetConstructor()    

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
   ca <- ChinookDataset("DEMOdz", dz)
   server <- ChinookServer()
   setServer(ca, server)
   checkEquals(getName(ca), "DEMOdz")
   checkEquals(getServer(ca), server)
   
} # test.datasetConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
