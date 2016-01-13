library(RUnit)
library(ChinookPCA)
library(ChinookServer)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testNullServerConstructor()
  testNormalServerConstructor()

} # runTests
#----------------------------------------------------------------------------------------------------
testNullServerConstructor <- function()
{
   print("--- testNullServerConstructor")

   server <- ChinookServer()
   pca <- ChinookPCA(server)
   checkTrue("createPCA" %in% getMessageNames(server))
   checkTrue("calculatePCA" %in% getMessageNames(server))
   
} # testNullServerConstructor
#----------------------------------------------------------------------------------------------------
# data packages and analysis packages are instantiate by the server
testNormalServerConstructor <- function()
{
   print("--- testNormalServerConstructor")

   analysisPackages = "ChinookPCA"
   datasets <- "DEMOdz"
   browserFile <- NA_character_
   userCredentials <- "test@nowhere.net"

   server <- ChinookServer(port=4001, analysisPackages, datasets, browserFile, userCredentials)

      # make sure the server properly created an instance of ChinookPCA
   checkTrue("ChinookPCA" %in% ls(server@state))
   pca.instance <- server@state[["ChinookPCA"]]

       # test for proper class and base class
   checkTrue("ChinookPCA" %in% is(pca.instance))
   checkTrue("ChinookAnalysis" %in% is(pca.instance))

} # testNormalServerConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
