#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAbrca <- setClass ("TCGAbrcaClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
#TCGAbrca <- function(name="", matrices=list(), history=PatientHistory(), manifest=data.frame())
TCGAbrca <- function()
{
  dir <- system.file(package="TCGAbrca", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)

  obj <- .TCGAbrca(SttrDataPackage(name="TCGAbrca",
                                 matrices=data$matrices,
                                 data.frames=data$data.frames,
                                 history=data$history,
                                 manifest=data$manifest))

  obj

} # TCGAbrca constructor

#----------------------------------------------------------------------------------------------------
