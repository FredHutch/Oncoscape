library(OncoDev14)
scriptDir <- "patientTimelines"
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz")
#current.datasets <- c("DEMOdz;TCGAgbm")
#current.datasets <- c("DEMOdz;TCGAgbm;TCGAbrain")
#current.datasets <- c("DEMOdz;TCGAgbm;TCGAlgg")
port <- 7501
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
