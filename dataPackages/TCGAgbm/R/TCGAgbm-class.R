#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAgbm <- setClass ("TCGAgbmClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
TCGAgbm <- function()
{
  dir <- system.file(package="TCGAgbm", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAgbm(SttrDataPackage(name="TCGAgbm",
                                  matrices=data$matrices,
                                  data.frames=data$data.frames,
                                  history=data$history,
                                  manifest=data$manifest,
                                  genesets=data$genesets,
                                  networks <- data$networks,
                                  sampleCategorizations=data$sampleCategorizations))
  obj

} # TCGAgbm constructor
#----------------------------------------------------------------------------------------------------
setMethod('getPatientIDs', 'TCGAgbmClass',
  function (obj, patient.ids) {
  	 
     ptIDs =  gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", patient.ids)
     ptIDs
     })
#----------------------------------------------------------------------------------------------------
