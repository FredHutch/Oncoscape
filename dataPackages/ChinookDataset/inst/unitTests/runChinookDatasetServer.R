library(ChinookServer)
library(ChinookDataset)
analysisPackages = "ChinookPCA"
datasets <- c("DEMOdz", "TCGAbrain")
browserFile <- NA_character_
userCredentials <- "test@nowhere.net"

chinook <- ChinookServer(port=4019, analysisPackages, datasets, browserFile, userCredentials)
run(chinook)
