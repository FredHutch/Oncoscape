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
   test..prepDataframeOrMatrixForJSON()

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
test..prepDataframeOrMatrixForJSON <- function()
{
   print("--- test..prepDataframeOrMatrixForJSON")
   dz <- DEMOdz()
   cds <- ChinookDataset("DEMOdz", dz)
   #server <- ChinookServer()
   #setServer(cds, server)

     # not many mutations, but two found in EGFR for 0749:
   mtx.mut <- matrices(dz)$mtx.mut

   expected.mutations <- "A289T,V774M"
   row <- which(rownames(mtx.mut) == "TCGA.06.0749")
   col <- which(colnames(mtx.mut) == "EGFR")

   checkEquals(mtx.mut[row, col], expected.mutations)

   prepped.list <- ChinookDataset:::.prepDataframeOrMatrixForJSON("DEMOdz", mtx.mut)
   checkEquals(sort(names(prepped.list)), c("colnames", "datasetName", "mtx", "rownames", "variables"))
   checkTrue(as.logical(prepped.list$mtx[row, col] == expected.mutations))

   json.var <- toJSON(prepped.list)
   checkTrue(nchar(json.var) > 7000)   # actually 7447 on (3 jan 2016)
      # a crude search
   checkEquals(grep(expected.mutations, json.var), 1)
   
} # test..prepDataframeOrMatrixForJSON
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
