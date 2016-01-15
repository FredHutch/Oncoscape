library(RUnit)
library(Groups)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
Sys.setlocale("LC_ALL", "C")   # set sort order, used by some tests
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.loadFiles()
  test.constructor();
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.loadFiles <- function()
{
   print("--- test.loadFiles")
   dir <- system.file(package="Groups", "extdata")
   checkTrue(file.exists(dir))
   x <- Groups:::.loadFiles(dir)
   checkEquals(x$test4, c("ELF4", "PIK3C2B", "EMP3", "PLAG1"))
   
} # test.loadFiles
#----------------------------------------------------------------------------------------------------
test.constructor <- function()
{
   print("--- testConstructor")
   g <- Groups("test")
   checkEquals(getName(g), "test")
   group.names <- getGroupNames(g)
   group.1 <- getGroup(g, group.names[1])
   checkTrue(length(group.1) > 0)
   
} # test.constructor
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
