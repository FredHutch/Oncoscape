library(RUnit)
library(ChinookAnalysis)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testConstructor();

} # runTests
#----------------------------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")
   ap <- ChinookAnalysis("test", server=NA)
   checkEquals(getName(ap), "test")
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
