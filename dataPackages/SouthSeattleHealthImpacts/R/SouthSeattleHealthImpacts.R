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
  full.path <- file.path(dir, "manifest.tsv")
  stopifnot(file.exists(full.path))

  manifest <- read.table(full.path, sep="\t", header=TRUE, as.is=TRUE);
  result <- Dataset:::.loadFiles(dir, manifest)

  .SouthSeattleHealthImpacts(Dataset(name="SouthSeattleHealthImpacts", manifest=manifest,
                             history=result$subjectHistory,
                             dictionary=result$dictionary))

} # SouthSeattleHealthImpacts constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "SouthSeattleHealthImpacts",

  function (obj) {
     contents <- paste(manifest(obj)$variable, collapse=", ")
     msg <- sprintf("SouthSeattleHealthImpacts: %s", contents);
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod('sampleIdToSubjectId', "SouthSeattleHealthImpacts",

  function (obj, sample.ids) {
     sample.ids
     })

#----------------------------------------------------------------------------------------------------
