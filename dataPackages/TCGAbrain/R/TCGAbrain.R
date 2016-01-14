#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.TCGAbrain <- setClass ("TCGAbrainClass", contains = "Dataset")
#----------------------------------------------------------------------------------------------------
#setGeneric('historyTable',   signature='obj', function (obj) standardGeneric ('historyTable'))
#----------------------------------------------------------------------------------------------------
# constructor
TCGAbrain <- function()
{
   dir <- system.file(package="TCGAbrain", "extdata")
   stopifnot(file.exists(dir))
   full.path <- file.path(dir, "manifest.tsv")
   stopifnot(file.exists(full.path))
   manifest <- read.table(full.path, sep="\t", header=TRUE, as.is=TRUE);
   result <- Dataset:::.loadFiles(dir, manifest)

   obj <- .TCGAbrain(Dataset(name="TCGAbrain", manifest=manifest,
                             history=result$subjectHistory,
                             dictionary=result$dictionary))

    obj

} # TCGAbrain constructor
#----------------------------------------------------------------------------------------------------
setMethod('sampleIdToSubjectId', 'TCGAbrainClass',

  function (obj, sample.ids) {
    gsub("(^TCGA\\.\\w\\w\\.\\w\\w\\w\\w).*","\\1", sample.ids)
     })

#----------------------------------------------------------------------------------------------------
