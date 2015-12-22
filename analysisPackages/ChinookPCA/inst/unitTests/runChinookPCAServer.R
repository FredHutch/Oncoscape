library(ChinookServer)
library(ChinookPCA)
analysisPackages = "ChinookPCA"
datasets <- "DEMOdz"
browserFile <- NA_character_
userCredentials <- "test@nowhere.net"

chinook <- ChinookServer(port=4009, analysisPackages, datasets, browserFile, userCredentials)
run(chinook)
