library(OncoDev14)
scriptDir <- "login"
userID <- "test@nowhere.org"
current.datasets <- c("DEMOdz")
port <- 7819
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets, password="ok")

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))

run(onco)
