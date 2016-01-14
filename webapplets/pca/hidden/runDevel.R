library(OncoDev14)
scriptDir <- "pca"
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz;TCGAgbm")
#current.datasets <- c("TCGAbrain")
#current.datasets <- c("DEMOdz")
port <- 7588
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)

