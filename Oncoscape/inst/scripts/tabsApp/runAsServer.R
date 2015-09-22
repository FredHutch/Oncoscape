.libPaths(c("/app/R/3.2.1/lib/R/library", 
            "~/lopez/oncoscape/v1.4.60/Rlibs/x86_64-unknown-linux-gnu-library/3.2"))
library(OncoDev14)
scriptDir <- "tabsApp"
stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0)
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz;TCGAgbm;TCGAbrain")
port <- 11004
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)
