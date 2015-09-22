#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAcoad <- setClass ("TCGAcoadClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAcoad <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAcoad <- function()
{
  dir <- system.file(package="TCGAcoad", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAcoad(SttrDataPackage(name="TCGAcoad",
                                  matrices=data$matrices,
                                  data.frames=data$data.frames,
                                  history=data$history,
                                  manifest=data$manifest,
                                  genesets=data$genesets))

  obj

} # TCGAcoad constructor

#----------------------------------------------------------------------------------------------------
