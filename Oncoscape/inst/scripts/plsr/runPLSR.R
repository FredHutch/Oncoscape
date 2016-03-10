printf = function (...) print (noquote (sprintf (...)))
args <- commandArgs()
print(args)

# default no-arg variables:

userID <- "autoTest@nowhere.org"
current.datasets <- "DEMOdz;TCGAgbm"

if(length(args) == 5)
   userID <- args[4]
   current.datasets <- args[5]

printf("userID: %s", userID);
printf("current.datasets: %s", current.datasets)

#stopifnot(4 == 5)

library(OncoDev14)
scriptDir <- "plsr"
port <- 7502
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez"){
  browseURL(sprintf("http://localhost:%d", port))
  }
run(onco)
