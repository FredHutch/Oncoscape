library(RUnit)
library(ChinookSimpleSummaryStats)
library(ChinookServer)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testNullServerConstructor()

} # runTests
#----------------------------------------------------------------------------------------------------
testNullServerConstructor <- function()
{
   print("--- testNullServerConstructor")

   server <- ChinookServer()
   stats <- ChinookSimpleSummaryStats(server)
   checkEquals(getMessageNames(server), "numericVectorSummaryStats")
   
} # testNullServerConstructor
#----------------------------------------------------------------------------------------------------
testNormalUseConstructor <- function()
{
   analysisPackages = "ChinookSimpleSummaryStats"
   datasets <- NA_character_
   browserFile <- NA_character_
   userCredentials <- "test@nowhere.net"

   chinook <- ChinookServer(port=4001, analysisPackages, datasets, browserFile, userCredentials)
   stats <- ChinookSimpleSummaryStats()
   setServer(stats, chinook)

} # testNormalUseConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
