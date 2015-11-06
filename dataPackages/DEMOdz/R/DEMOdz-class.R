#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.DEMOdz <- setClass ("DEMOdzClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
DEMOdz <- function()
{
  dir <- system.file(package="DEMOdz", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .DEMOdz(SttrDataPackage(name="DEMOdz",
                                 matrices=data$matrices,
                                 data.frames=data$data.frames,
                                 history=data$history,
                                 manifest=data$manifest,
                                 genesets=data$genesets,
                                 networks=data$networks,
                                 sampleCategorizations=data$sampleCategorizations))

  obj

} # DEMOdz constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "DEMOdzClass",
  function (obj) {
     contents <- paste(manifest(obj)$variable, collapse=", ")
     msg <- sprintf("DEMOdz: %s", contents);
     cat (msg, "\n", sep="")
     })
#----------------------------------------------------------------------------------------------------
setMethod('canonicalizePatientIDs', "DEMOdzClass",
  function (obj, patient.ids) {
  	 
     patient.ids
     })
