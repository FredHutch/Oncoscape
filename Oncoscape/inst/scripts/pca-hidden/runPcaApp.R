<<<<<<< HEAD
library(OncoDev14)
=======
library(Chinook)
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
scriptDir <- "pca"
userID <- "autoTest@nowhere.org"
#current.datasets <- "DEMOdz;TCGAgbm"
current.datasets <- "DEMOdz"
port <- 7501
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
