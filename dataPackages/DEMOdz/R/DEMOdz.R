#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.DEMOdz <- setClass ("DEMOdz", contains = "Dataset")
#----------------------------------------------------------------------------------------------------
<<<<<<< HEAD
=======
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
# constructor
DEMOdz <- function()
{
   dir <- system.file(package="DEMOdz", "extdata")
   stopifnot(file.exists(dir))
   full.path <- file.path(dir, "manifest.tsv")
   stopifnot(file.exists(full.path))
   manifest <- read.table(full.path, sep="\t", header=TRUE, as.is=TRUE);
   result <- Dataset:::.loadFiles(dir, manifest)

   .DEMOdz(Dataset(name="DEMOdz", manifest=manifest,
                   history=result$subjectHistory,
                   dictionary=result$dictionary))

} # DEMOdz constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "DEMOdz",

  function (obj) {
     contents <- paste(getManifest(obj)$variable, collapse=", ")
     msg <- sprintf("DEMOdz: %s", contents);
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod('sampleIdToSubjectId', "DEMOdz",

  function (obj, sample.ids) {
     sample.ids
     })

#----------------------------------------------------------------------------------------------------
