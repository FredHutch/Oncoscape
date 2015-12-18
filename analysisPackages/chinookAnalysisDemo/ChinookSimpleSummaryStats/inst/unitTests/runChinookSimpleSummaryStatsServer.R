library(ChinookServer)
library(ChinookSimpleSummaryStats)
analysisPackages = "ChinookSimpleSummaryStats"
datasets <- NA_character_
browserFile <- NA_character_
userCredentials <- "test@nowhere.net"

chinook <- ChinookServer(port=4001, analysisPackages, datasets, browserFile, userCredentials)
run(chinook)
