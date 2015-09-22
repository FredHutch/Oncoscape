#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAlung <- setClass ("TCGAlungClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAlung <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAlung <- function()
{
  dir <- system.file(package="TCGAlung", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAlung(SttrDataPackage(name="TCGAlung",
                                 matrices=data$matrices,
                                 data.frames=data$data.frames,
                                 history=data$history,
                                 manifest=data$manifest))

  obj

} # TCGAlung constructor

#----------------------------------------------------------------------------------------------------
