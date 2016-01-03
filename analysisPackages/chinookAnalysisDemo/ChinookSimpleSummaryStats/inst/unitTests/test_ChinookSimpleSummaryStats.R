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
   checkTrue("numericVectorSummaryStats" %in% getMessageNames(server))
   
} # testNullServerConstructor
#----------------------------------------------------------------------------------------------------
testNormalUseConstructor <- function()
{
   analysisPackages = "ChinookSimpleSummaryStats"
   datasets <- NA_character_
   browserFile <- NA_character_
   userCredentials <- "test@nowhere.net"

   chinook <- ChinookServer(port=4001, analysisPackages, datasets, browserFile, userCredentials)
   stats <- ChinookSimpleSummaryStats(chinook)

} # testNormalUseConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
