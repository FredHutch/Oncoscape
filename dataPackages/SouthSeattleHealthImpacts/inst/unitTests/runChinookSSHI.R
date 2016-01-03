library(ChinookServer)
library(RUnit)
analysisPackages <- NA_character_
PORT=7035
datasets <- "SouthSeattleHealthImpacts"
browserFile <- NA_character_
userCredentials <- "test@nowhere.net"
chinook <- ChinookServer(port=PORT, analysisPackages, datasets, browserFile, userCredentials)
checkEquals(getDatasetNames(chinook), "SouthSeattleHealthImpacts")
# ds <- getDatasetByName(chinook, "SouthSeattleHealthImpacts")

if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", PORT))

run(chinook)
# view manifest in browser:
# http://localhost:7001?jsonMsg='{"cmd":"getDatasetManifest","status":"request","callback":"","payload":"SouthSeattleHealthImpacts"}'
