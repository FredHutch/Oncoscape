library(OncoDev14)
scriptDir <- "survival"
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz;TCGAgbm")
port <- 7571
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
browseURL(sprintf("http://localhost:%d", port))
run(onco)
