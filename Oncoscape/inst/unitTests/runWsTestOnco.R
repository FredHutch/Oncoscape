library(OncoDev14)
#BiocGenerics:::testPackage("OncoDev14")
scriptDir <- NA_character_
userID <- "test@nowhere.net"
current.datasets <- c("DEMOdz;TCGAgbm")
port <- 6001
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
run(onco)
