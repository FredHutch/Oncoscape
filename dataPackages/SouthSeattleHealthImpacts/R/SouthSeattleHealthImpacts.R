#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.SouthSeattleHealthImpacts <- setClass ("SouthSeattleHealthImpacts", contains = "Dataset")
#----------------------------------------------------------------------------------------------------
# constructor
SouthSeattleHealthImpacts <- function()
{
  dir <- system.file(package="SouthSeattleHealthImpacts", "extdata")
  stopifnot(file.exists(dir))
  data <- Dataset:::.loadFiles(dir)

  obj <- .SouthSeattleHealthImpacts(Dataset(name="SouthSeattleHealthImpacts",
                         matrices=data$matrices,
                         data.frames=data$data.frames,
                         history=data$history,
                         manifest=data$manifest,
                         genesets=data$genesets,
                         networks=data$networks,
                         sampleCategorizations=data$sampleCategorizations))

  obj

} # SouthSeattleHealthImpacts constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "SouthSeattleHealthImpacts",

  function (obj) {
     contents <- paste(manifest(obj)$variable, collapse=", ")
     msg <- sprintf("SouthSeattleHealthImpacts: %s", contents);
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod('canonicalizeSampleIDs', "SouthSeattleHealthImpacts",

  function (obj, sample.ids) {
     sample.ids
     })

#----------------------------------------------------------------------------------------------------
