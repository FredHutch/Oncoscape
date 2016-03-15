library(OncoDev14)
scriptDir <- "pca"
userID <- "autotest@nowhere.org"
#current.datasets <- "DEMOdz;UWlung"
current.datasets <- "DEMOdz"
#current.datasets <- "DEMOdz;TCGAgbm;TCGAbrain"
port <- 7565
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
browseURL(sprintf("http://localhost:%d", port))
if(Sys.info()[["nodename"]] != "lopez") 
   run(onco)
