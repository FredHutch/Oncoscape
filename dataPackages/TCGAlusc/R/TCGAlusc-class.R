#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAlusc <- setClass ("TCGAluscClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAlusc <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAlusc <- function()
{
  dir <- system.file(package="TCGAlusc", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAlusc(SttrDataPackage(name="TCGAlusc",
                                 matrices=data$matrices,
                                 data.frames=data$data.frames,
                                 history=data$history,
                                 manifest=data$manifest))

  obj

} # TCGAlusc constructor

#----------------------------------------------------------------------------------------------------
setMethod('canonicalizePatientIDs', 'TCGAluscClass',
  function (obj, patient.ids) {
  	 
     ptIDs =  gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", patient.ids)
     ptIDs
     })
#----------------------------------------------------------------------------------------------------
