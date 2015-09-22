library(OncoDev14)
scriptDir <- "userDataStore"
userID <- "test@nowhere.net"
current.datasets <- c("DEMOdz")
port <- 7532
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)

if(Sys.info()[["nodename"]] != "lopez")
    browseURL(sprintf("http://localhost:%d", port))

run(onco)
