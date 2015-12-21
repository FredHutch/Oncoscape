printf = function (...) print (noquote (sprintf (...)))
args <- commandArgs()
print(args)

userID <- "demo@fredhutch.org"
current.datasets <- "DEMOdz"

if(length(args) == 5)
   userID <- args[4]
   current.datasets <- args[5]

printf("userID: %s", userID);
printf("current.datasets: %s", current.datasets)

library(OncoDev14)
scriptDir <- "apps/oncotest"
port <- 7578

onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez"){
  browseURL(sprintf("http://localhost:%d", port))
}

run(onco)
