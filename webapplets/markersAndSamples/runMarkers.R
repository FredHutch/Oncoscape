library(ChinookServer)
library(RUnit)
analysisPackages <- NA_character_
PORT=6034
datasets <- "DEMOdz"
browserFile <- "index.html"
userCredentials <- "test@nowhere.net"
chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", PORT))

run(chinook)


