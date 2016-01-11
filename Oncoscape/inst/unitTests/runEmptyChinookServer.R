library(ChinookServer)
analysisPackages <- NA_character_
datasets <- NA_character_
browserFile <- NA_character_
userCredentials <- "test@nowhere.net"
PORT <- 6001
chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)
run(chinook)
