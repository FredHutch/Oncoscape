library(OncoDev14)
scriptDir <- "linkout"
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz")
port <- 7397
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))

run(onco)
library(Oncoscape)
startWebApp("linkout/index.html", port=7589L)
