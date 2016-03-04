#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAprad <- setClass ("TCGApradClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAprad <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAprad <- function()
{
  dir <- system.file(package="TCGAprad", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAprad(SttrDataPackage(name="TCGAprad",
                                 matrices=data$matrices,
                                 data.frames=data$data.frames,
                                 history=data$history,
                                 manifest=data$manifest,
                                 genesets=data$genesets,
                                 networks = data$networks,
                                 sampleCategorizations=data$sampleCategorizations
))

  obj

} # TCGAprad constructor

#----------------------------------------------------------------------------------------------------
setMethod('canonicalizePatientIDs', 'TCGApradClass',
  function (obj, patient.ids) {
  	 
     ptIDs =  gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", patient.ids)
     ptIDs
     })
#----------------------------------------------------------------------------------------------------
