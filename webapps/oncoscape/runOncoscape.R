library(ChinookServer)
library(RUnit)
analysisPackages <- "ChinookPCA"
PORT=6034
datasets <- c("DEMOdz", "TCGAbrain")
browserFile <- "index.html"
userCredentials <- "test@nowhere.net"
chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", PORT))

run(chinook)


