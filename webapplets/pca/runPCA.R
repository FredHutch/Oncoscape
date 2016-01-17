library(ChinookServer)
library(RUnit)
PORT=6015
<<<<<<< HEAD
datasets <- c("DEMOdz", "TCGAbrain")
=======
datasets <- "DEMOdz"
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
analysisPackages <- c("ChinookPCA")
browserFile <- "index.html"
userCredentials <- "test@nowhere.net"
chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", PORT))

run(chinook)


