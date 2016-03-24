#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAlgg <- setClass ("TCGAlggClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAlgg <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAlgg <- function()
{
  dir <- system.file(package="TCGAlgg", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAlgg(SttrDataPackage(name="TCGAlgg",
                                 matrices=data$matrices,
                                 data.frames=data$data.frames,
                                 history=data$history,
                                 manifest=data$manifest,
                                 genesets=data$genesets,
                                 networks = data$networks,
                                 sampleCategorizations=data$sampleCategorizations
))


  obj

} # TCGAlgg constructor
#----------------------------------------------------------------------------------------------------
setMethod('canonicalizePatientIDs', 'TCGAlggClass',
  function (obj, patient.ids) {
     
     ptIDs =  gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", patient.ids)
     ptIDs
     })
#----------------------------------------------------------------------------------------------------
