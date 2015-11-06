library(RUnit)
library(NetworkMaker)
library(SttrDataPackage)
library(DEMOdz)
library(TCGAbrca)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testConstructor();
  test.extractSamplesAndGenes()
  test.calculateSimilarity()
  
} # runTests
#----------------------------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")
   dzName <- "DEMOdz"
   netMaker <- NetworkMaker(dzName)
   checkEquals(getPackage(netMaker), dzName)
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
test.extractSamplesAndGenes <- function()
{
    print("--- test.extractSamplesAndGenes")
    dzName <- "TCGAbrca"
    #dzName <- "TCGAgbm"
    netMaker <- NetworkMaker(dzName)
    x <- NetworkMaker:::.extractSamplesAndGenes(netMaker)
    checkEquals(names(x), c("samples", "genes"))
    checkTrue(length(x$samples) > 500 & length(x$samples) < 600)
    checkTrue(length(x$genes) >  1000 & length(x$genes) < 2000)
    
} # test.extractSamplesAndGenes
#----------------------------------------------------------------------------------------------------
test.calculateSimilarity <- function()
{
    print("--- test.calculateSimilarity")
    dzName <- "TCGAgbm"

    netMaker <- NetworkMaker(dzName)
    goi <- c("IFNA1", "DMRTA1", "VSTM2A", "VOPP1", "LANCL2", "MTAP", "SEC61G", "EGFR", "CDKN2B", "CDKN2A")
    poi <- c("TCGA.76.4934.01", "TCGA.14.1823.01", "TCGA.19.1388.01", "TCGA.06.0216.01", "TCGA.14.3477.01")
    mtx <- calculateSimilarityMatrix(netMaker, poi, goi)
  
    
} # test.calculateSimilarity
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
