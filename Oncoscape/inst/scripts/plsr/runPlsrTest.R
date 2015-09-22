library(OncoDev14)
scriptDir <- "plsr"
userID <- "autoTest@nowhere.org"
current.datasets <- c("DEMOdz")
port <- 7568
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))

run(onco)
