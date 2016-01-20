library(OncoDev14)
scriptDir <- "plsr"
userID <- "autoTest@nowhere.org"
#current.datasets <- "DEMOdz;TCGAgbm"
current.datasets <- "DEMOdz"
port <- 7502
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
