library(OncoDev14)
scriptDir <- "tests"
userID <- "test@nowhere.org"
#current.datasets <- c("DEMOdz;TCGAgbm")
current.datasets <- c("DEMOdz")
port <- 7519
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))

run(onco)

