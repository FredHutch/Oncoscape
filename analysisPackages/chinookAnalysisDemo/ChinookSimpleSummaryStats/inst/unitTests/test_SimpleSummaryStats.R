library(RUnit)
library(SimpleSummaryStats)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testConstructor()
  testGetResults()

} # runTests
#----------------------------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")

   stats <- SimpleSummaryStats()
   checkEquals(calculate(stats)$mean, 0)
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
testGetResults <- function()
{
   print("--- testGetResults")

   set.seed(37)
   vector <- runif(5, min=0, max=10)
   stats <- SimpleSummaryStats(vector)
   x <- calculate(stats)
   print(x)
   checkEquals(sort(names(x)), c("max", "mean", "min", "sd"))
   checkEqualsNumeric(x$max,  7.187873, tol=1e4)
   checkEqualsNumeric(x$min,  0.788371, tol=1e4)
   checkEqualsNumeric(x$mean, 4.985831, tol=1e4)
   checkEqualsNumeric(x$sd,   2.499255, tol=1e4)

} # testGetResults
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
