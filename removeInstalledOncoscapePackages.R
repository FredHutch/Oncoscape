printf = function (...) print (noquote (sprintf (...)))

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

pkgs <- c("DEMOdz", "OncoDev", "OncoDev14",
          "PLSR", "PCA", "PatientHistory", "SttrDataPackage", "SttrDataSet",
          "TCGAbrain", "TCGAgbm", "TCGAlgg", "TCGAluad", "iDEMOdz")

# in some of our oncoscape installations we maintain a version-specific R library
# such extra directories are returned by the R builtin ".libPaths()".
# we add such a libPath, supplementing the often controlled-by-root default library
# directory, by e.g., this shell command
# export R_LIBS=/home/sttrweb/lopez/oncoscape/v1.4.60/Rlibs/x86_64-unknown-linux-gnu-library/3.2
# 
# testing shows that these additional directories -- which is where our Oncoscape data,
# analysis and supporting packages will be installed -- are prepended to the libPath list.  thus
# a general (?) solution to this problem, subject to more experience, is that this
# will be the first path returned

libPath <- .libPaths()[1]
pkgs.paths <- file.path(libPath, pkgs)

deleters <- which(file.exists(pkgs.paths))
printf("oncoscape-related packages to remove before testing: %d", length(deleters))

if(length(deleters) > 0){
   pkgs.to.remove <- pkgs[deleters];
   print(paste("removing package ", paste(pkgs.to.remove, collapse=",")))
   remove.packages(pkgs.to.remove, .libPaths())
   }
