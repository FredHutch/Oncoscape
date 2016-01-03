library(RUnit)
library(SouthSeattleHealthImpacts)
library(RCurl)
library(jsonlite)
#----------------------------------------------------------------------------------------------------
# standardize alphabetic sort order
Sys.setlocale("LC_ALL", "C")
#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  printf("=== test_SouthSeattleHealthImpacts.R, runTests()")

  testGetManifest()
  testGetFactors();

} # runTests
#----------------------------------------------------------------------------------------------------
testGetManifest <- function()
{
   print("--- testGetManifest")
   json <- URLencode('{"cmd":"getDatasetManifest","status":"request","callback":"","payload":"SouthSeattleHealthImpacts"}')
   url <- sprintf("http://localhost:7035?jsonMsg='%s'", json)
   x1 <- fromJSON(getURL(url))
   checkTrue(is.list(x1))
   checkEquals(names(x1), c("cmd", "status", "callback", "payload"))
   checkEquals(names(x1$payload), c("datasetName", "variables", "colnames", "rownames", "mtx"))
   checkEquals(x1$payload$rownames, c("tbl.factors.RData", "tbl.neighborhoods.RData", "zipCodes-json.RData"))
   checkEquals(dim(x1$payload$mtx), c(3,11))
   checkEquals(x1$payload$variables, c("tbl.factors", "tbl.neighborhoods", "zipCodes"))

} # testGetManifest
#---------------------------------------------------------------------------------------------------
testGetFactors <- function()
{
   print("--- testGetFactors")
   json <- URLencode('{"cmd":"getDatasetManifest","status":"request","callback":"","payload":"SouthSeattleHealthImpacts"}')
   url <- sprintf("http://localhost:7035?jsonMsg='%s'", json)
   x1 <- fromJSON(getURL(url))
   checkTrue(is.list(x1))
   checkEquals(names(x1), c("cmd", "status", "callback", "payload"))
   checkEquals(names(x1$payload), c("datasetName", "variables", "colnames", "rownames", "mtx"))
   checkEquals(x1$payload$rownames, c("tbl.factors.RData", "tbl.neighborhoods.RData", "zipCodes-json.RData"))
   checkEquals(dim(x1$payload$mtx), c(3,11))
   checkEquals(x1$payload$variables, c("tbl.factors", "tbl.neighborhoods", "zipCodes"))

} # testGetManifest
#---------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
