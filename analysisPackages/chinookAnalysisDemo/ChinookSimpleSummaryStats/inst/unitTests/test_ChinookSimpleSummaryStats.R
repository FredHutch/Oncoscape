library(RUnit)
library(ChinookSimpleSummaryStats)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testNullServerConstructor()

} # runTests
#----------------------------------------------------------------------------------------------------
testNullServerConstructor <- function()
{
   print("--- testNullServerConstructor")

   print(1)
   server <- ChinookServer()
   print(2)
   stats <- ChinookSimpleSummaryStats(server)
   print(3)
   
} # testNullServerConstructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
