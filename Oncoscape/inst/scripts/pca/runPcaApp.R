library(OncoDev14)
scriptDir <- "pca"
userID <- "autoTest@nowhere.org"
current.datasets <- "DEMOdz;TCGAgbm;TCGAbrain"
port <- 7501
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
browseURL(sprintf("http://localhost:%d", port))
if(Sys.info()[["nodename"]] != "lopez") 
   run(onco)

