library(ChinookServer)
library(RUnit)
PORT=6015
datasets <- "DEMOdz"
analysisPackages <- c("ChinookPCA")
browserFile <- "index.html"
userCredentials <- "test@nowhere.net"
chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", PORT))

run(chinook)


