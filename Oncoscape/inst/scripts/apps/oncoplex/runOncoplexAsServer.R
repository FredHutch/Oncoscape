library(OncoDev14)
sessionInfo()
scriptDir <- "apps/oncoplex"
stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0)
userID <- "test@nowhere.org"
#current.datasets <- c("DEMOdz;UWlung")
#current.datasets <- c("DEMOdz")
current.datasets <- "UWlung";
port <- 11004
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets, password="rainstorm")
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
