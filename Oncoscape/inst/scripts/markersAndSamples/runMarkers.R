library(OncoDev14)
scriptDir <- "markersAndSamples"
userID <- "autotest@nowhere.org"
#current.datasets <- "DEMOdz;UWlung"
#current.datasets <- "DEMOdz"
#current.datasets <- "DEMOdz;DEMOdz;DEMOdz"
#current.datasets <- "DEMOdz;TCGAgbm"
current.datasets <- "DEMOdz;TCGAgbm;TCGAbrain"
port <- 7575
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez"){
  browseURL(sprintf("http://localhost:%d", port))
  }
run(onco)
