library(OncoDev14)
sessionInfo()
scriptDir <- "apps/eric"
stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0)
userID <- "test@nowhere.org"
#current.datasets <- "DEMOdz"
current.datasets <- "DEMOdz;TCGAgbm;TCGAbrain"
port <- 11995
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets, password="tukw!LL8")
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
