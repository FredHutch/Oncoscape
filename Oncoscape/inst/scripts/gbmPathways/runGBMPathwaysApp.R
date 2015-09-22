library(OncoDev14)
scriptDir <- "gbmPathways"
userID <- "test@nowhere.org"
#current.datasets <- c("DEMOdz;TCGAgbm;TCGAbrain")
#current.datasets <- "DEMOdz;TCGAgbm"
current.datasets <- "DEMOdz"
port <- 7583
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
browseURL(sprintf("http://localhost:%d", port))
if(Sys.info()[["nodename"]] != "lopez") 
   run(onco)
