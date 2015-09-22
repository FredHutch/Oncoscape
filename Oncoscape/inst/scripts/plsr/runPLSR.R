library(OncoDev14)
scriptDir <- "plsr"
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz;TCGAgbm")
port <- 7501
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
