# test_ChinookServer.R
#------------------------------------------------------------------------------------------------------------------------
PORT = 4124
#------------------------------------------------------------------------------------------------------------------------
library(RUnit)
library(ChinookServer)
#------------------------------------------------------------------------------------------------------------------------
runTests <- function()
{
   test_constructor()

} # runTests
#------------------------------------------------------------------------------------------------------------------------
test_constructor <- function()
{
   print("--- test_constructor")
   empty.server <- ChinookServer();
   checkTrue(is.na(getDatasetNames(empty.server)))

   analysisPackages = NA_character_
   datasets <- c("DEMOdz", "TCGAgbm")
   browserFile <- NA_character_
   userCredentials <- "test@nowhere.net"

   chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)
   checkEquals(port(chinook), PORT)
   version <- serverVersion(chinook)
       # 1.0.1 or greater and interpretable as integers
   checkTrue(sum(as.integer(strsplit(version, ".", fixed=TRUE)[[1]])) > 1)
   checkEquals(getDatasetNames(chinook), datasets)
   checkEquals(getAnalysisPackageNames(chinook), analysisPackages)
   checkEquals(length(getMessageNames(chinook)), 0)   # analysis packages register messages, none registered yet

} # test_constructor
#------------------------------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
