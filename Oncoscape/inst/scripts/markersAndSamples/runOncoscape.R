library(OncoDev14)
sessionInfo()
scriptDir <- "markersAndSamples"
stopifnot(nchar(Sys.getenv("ONCOSCAPE_USER_DATA_STORE")) > 0)
userID <- "demo@nowhere.org"
#current.datasets <- c("TCGAbrain;")
#current.datasets <- c("DEMOdz;TCGAgbm;TCGAlgg;TCGAbrain;TCGAbrca;TCGAprad;TCGAlusc;TCGAluad;TCGAlung;TCGAhnsc;TCGAcoadread")
current.datasets <- c("DEMOdz;TCGAgbm;TCGAlgg;TCGAbrain;TCGAbrca;TCGAprad;TCGAluad;TCGAlung")
port <- 7777
onco <- OncoDev14(port=port, scriptDir=scriptDir, userID=userID, datasetNames=current.datasets)
if(Sys.info()[["nodename"]] != "lopez") 
   browseURL(sprintf("http://localhost:%d", port))
run(onco)

