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
   ca <- ChinookAnalysis("test")
   server <- ChinookServer()
   setServer(ca, server)
   checkEquals(getName(ca), "test")
   checkEquals(getServer(ca), server)
   
   ca2 <- ChinookAnalysis("test2")   # also an empty server
   checkEquals(getName(ca2), "test2")
   checkTrue(is.na(getServer(ca2)))
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
