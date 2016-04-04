library(RUnit)

printf = function (...) print (noquote (sprintf (...)))
if(!exists("biocLite"))
    source("http://bioconductor.org/biocLite.R")

#------------------------------------------------------------------------------------------
# add newly-developed Oncoscape packages to this list as they become available
# a strong version of this task would be to remove ALL packages other than those classifed,
# via the Priority column in the data.frame returned by installed.packages, as
# either "base" or "recommended" by the authors of R.
#
#  ip <- installed.packages()
#  pkgs.to.remove <- ip[!(ip[,"Priority"] %in% c("base", "recommended")), 1]
#  sapply(pkgs.to.remove, remove.packages)
#  sapply(pkgs.to.remove, install.packages)
#------------------------------------------------------------------------------------------
removePackage <- function(pkgs)
{
  for(path in .libPaths()){
    pkgs.path <- file.path(path, pkgs)
    deleters <- which(file.exists(pkgs.path))
    printf("removing from libPath %s: %d", path, length(deleters))
    if(length(deleters) > 0){
       pkgs.to.remove <- pkgs[deleters];
       print(paste("removing package ", paste(pkgs.to.remove, collapse=",")))
       remove.packages(pkgs.to.remove, .libPaths())
       } # if length
    } # for path
  
} # removePackage
#----------------------------------------------------------------------------------------------------
# install a small standard package "pls" which we use in the PLSR analysis package
test_removePackage <- function()
{
   print("--- testing removePackage")
   pkgs <- "pls"
   tempLib <- tempdir()
   .libPaths(tempLib)
   biocLite(pkgs, lib=tempLib, suppressUpdates=TRUE)
   Sys.sleep(15)  # a crude wait for the package intallation to finish
   checkTrue(file.exists(file.path(tempLib, "pls")))
   removePackage(pkgs)
   checkTrue(!file.exists(file.path(tempLib, "pls")))
   printf("--- successful test of removePackage")
       
} # test_removePackage

#----------------------------------------------------------------------------------------------------
# test that there are no existing files matching the pkgs
test_allPackagesRemoved <- function(pkgs){

	for(path in .libPaths()){
    	pkgs.path <- file.path(path, pkgs)
	    deleters <- which(file.exists(pkgs.path))
    	checkEquals(length(deleters), 0)
		printf("%d Packages remaining: %s", length(deleters), path)
	}
    

} #test_allPackageRemoved
#----------------------------------------------------------------------------------------------------
# this list needs ongoing curation.  add new Oncoscape-related package names here

args <- commandArgs()
print(args)

if(length(args) == 5){
   directories <- args[5]
   directories <- strsplit(directories, ";")[[1]]
} else { directories = "." }

pkgs <- c()
 for(pkg.dir in directories){
 	pkg.path = list.files(path=pkg.dir, pattern = "DESCRIPTION", recursive = TRUE, include.dirs=TRUE, full.name=T) 	
	pkg.names <- lapply(pkg.path, function(pkg.filename){ gsub('Package:\\s+', "", grep('^Package:\\s+.+',readLines(pkg.filename), value=T))  })
 	pkgs <- c(pkgs, unlist(pkg.names))
 }
 
 pkgs <- unique(pkgs)


if(!interactive()){
  test_removePackage()
  removePackage(pkgs)
  test_allPackagesRemoved(pkgs)
  }

#----------------------------------------------------------------------------------------------------
# in some of our oncoscape installations we maintain a version-specific R library
# such extra directories are returned by the R builtin ".libPaths()".
# we add such a libPath, supplementing the often controlled-by-root default library
# directory, by e.g., this shell command
# export R_LIBS=/home/sttrweb/lopez/oncoscape/v1.4.60/Rlibs/x86_64-unknown-linux-gnu-library/3.2
# all the above-named pkgs are deleted from any libPath in which they are found