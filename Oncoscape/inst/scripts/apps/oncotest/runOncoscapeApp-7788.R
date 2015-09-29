library(OncoDev14)
sessionInfo()
scriptDir <- "apps/oncotest"
stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0)
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz;TCGAgbm")
port <- 7788
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
