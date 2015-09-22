library(OncoDev14)
scriptDir <- "pathways/gbmPathways"
userID <- "test@nowhere.org"
#current.datasets <- c("DEMOdz;TCGAgbm;TCGAbrain")
#current.datasets <- "DEMOdz;UWlung"
current.datasets <- "DEMOdz"
port <- 7533
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
browseURL(sprintf("http://localhost:%d", port))
if(Sys.info()[["nodename"]] != "lopez") 
   run(onco)
