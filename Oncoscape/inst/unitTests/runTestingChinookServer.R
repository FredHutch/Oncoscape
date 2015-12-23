library(ChinookServer)
analysisPackages <- NA_character_
datasets <- NA_character_
browserFile <- NA_character_
userCredentials <- "test@nowhere.net"
chinook <- ChinookServer(port=4099, analysisPackages, datasets, browserFile, userCredentials)
run(chinook)
