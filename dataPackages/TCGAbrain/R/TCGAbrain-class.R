#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAbrain <- setClass ("TCGAbrainClass", contains = "SttrDataPackageClass")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
TCGAbrain <- function()
{
  dir <- system.file(package="TCGAbrain", "extdata")
  stopifnot(file.exists(dir))
  data <- SttrDataPackage:::.loadFiles(dir)
  printf("TCGAbrain ctor, nchar(network): %d", nchar(data$networks[1]))

  obj <- .TCGAbrain(SttrDataPackage(name="TCGAbrain",
                                    matrices=data$matrices,
                                    data.frames=data$data.frames,
                                    history=data$history,
                                    manifest=data$manifest,
                                    genesets=data$genesets,
                                    networks <- data$networks,
                                    sampleCategorizations=data$sampleCategorizations))

  printf("concluding TCGAbrain ctor, network count: %d", length(obj@networks))
  obj

} # TCGAbrain constructor
#----------------------------------------------------------------------------------------------------
setMethod('canonicalizePatientIDs', 'TCGAbrainClass',
  function (obj, patient.ids) {
  	 
     ptIDs =  gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", patient.ids)
     ptIDs
     })
#----------------------------------------------------------------------------------------------------
