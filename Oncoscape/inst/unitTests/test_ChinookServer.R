# test_ChinookServer.R
#------------------------------------------------------------------------------------------------------------------------
PORT = 6001
#------------------------------------------------------------------------------------------------------------------------
library(RUnit)
library(RCurl)
library(ChinookServer)
library(tools)
#------------------------------------------------------------------------------------------------------------------------
runTests <- function()
{
   test_constructor()
   test_retrieveDatasets()
   test_runningServer()

} # runTests
#------------------------------------------------------------------------------------------------------------------------
test_constructor <- function()
{
   print("--- test_constructor")
   empty.server <- ChinookServer();
   checkTrue(is.na(getDatasetNames(empty.server)))

   analysisPackages = NA_character_
   #datasets <- c("DEMOdz", "TCGAgbm")
   datasets <- c("DEMOdz")
   browserFile <- NA_character_
   userCredentials <- "test@nowhere.net"

   chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)

     # run(chinook) 
     #  this will block, preventing the next tests.
     # see test_runningServer below for a live test of the server

   checkEquals(port(chinook), PORT)
   #version <- serverVersion(chinook)
       # 1.0.1 or greater and interpretable as integers
   #checkTrue(sum(as.integer(strsplit(version, ".", fixed=TRUE)[[1]])) > 1)
   checkEquals(getDatasetNames(chinook), datasets)
   checkEquals(getAnalysisPackageNames(chinook), analysisPackages)
   checkTrue("getDatasetManifest" %in% getMessageNames(chinook))

} # test_constructor
#------------------------------------------------------------------------------------------------------------------------
test_retrieveDatasets <- function()
{
   print("--- test_retrieveDatasets")

   analysisPackages = "ChinookSimpleSummaryStats"
   #datasets <- c("DEMOdz", "TCGAgbm")
   datasets <- c("DEMOdz")
   browserFile <- NA_character_
   userCredentials <- "test@nowhere.net"

   chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)

     # run(chinook) 
     #  this will block, preventing the next tests.
     # see test_runningServer below for a live test of the server

   checkTrue(all(datasets %in% getDatasetNames(chinook)))
   dz <- getDatasetByName(chinook, "DEMOdz")
   checkTrue("mtx.mut" %in% names(matrices(dz)))

      # next tests deferred until TCGAgbm is converted to be a Dataset, not an SttrDataPackage
   #dz2 <- getDatasetByName(chinook, "TCGAgbm")
   #checkTrue("mtx.mut" %in% names(matrices(dz2)))

   #checkEquals(port(chinook), PORT)
   #version <- serverVersion(chinook)
       # 1.0.1 or greater and interpretable as integers
   #checkTrue(sum(as.integer(strsplit(version, ".", fixed=TRUE)[[1]])) > 1)
   checkEquals(getDatasetNames(chinook), datasets)
   checkEquals(getAnalysisPackageNames(chinook), analysisPackages)
   checkTrue("getDatasetManifest" %in% getMessageNames(chinook))

} # test_retrieveDatasets
#------------------------------------------------------------------------------------------------------------------------
# unix-style ps (process status) helper function to locate process id of any instance of the named script
# and to kill it 
killServer <- function(scriptName)
{
    printf("   chinook server already running?")
    cmd <- sprintf("ps x | grep %s | grep -v grep |awk '{print $1}'", scriptName)
    pids <- system(cmd, intern=TRUE)

    if(length(pids) > 0){
       printf("   killing already running server")
       pids <- as.integer(pids)
       lapply(pids, pskill)
       printf("   waiting 10 seconds for kill to complete")
       Sys.sleep(10)
       }
    else{
       printf("   no previous server found");
       }

} # killServer
#------------------------------------------------------------------------------------------------------------------------
test_runningServer <- function()
{
    printf("--- test_runningServer")
    scriptName <- "runEmptyChinookServer.R"
    killServer(scriptName)
    printf("   starting server in background")
    system(sprintf("bash R --no-save --silent -f %s &", scriptName))

       # give it some time to start
    printf("   giving server a chance to start, sleeping 10")
    Sys.sleep(10)

    printf("   checking main port http get")
    url <- sprintf("http://localhost:%d", PORT)
    checkEquals(getURL(url), "hello from ChinookServer main port")

    printf("   checking aux port http get")
    url <- sprintf("http://localhost:%d", PORT+1)
    checkEquals(getURL(url), "hello from ChinookServer auxiliary port")

    killServer(scriptName)

} # test_runningServer
#------------------------------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
