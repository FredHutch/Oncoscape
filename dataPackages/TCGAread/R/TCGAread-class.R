#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAread <- setClass ("TCGAreadClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAread <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAread <- function()
{
  dir <- system.file(package="TCGAread", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAread(SttrDataPackage(name="TCGAread",
                                  matrices=data$matrices,
                                  data.frames=data$data.frames,
                                  history=data$history,
                                  manifest=data$manifest,
                                  genesets=data$genesets))

  obj

} # TCGAread constructor

#----------------------------------------------------------------------------------------------------
setMethod('canonicalizePatientIDs', 'TCGAreadClass',
  function (obj, patient.ids) {
     
     ptIDs =  gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", patient.ids)
     ptIDs
     })
#----------------------------------------------------------------------------------------------------
