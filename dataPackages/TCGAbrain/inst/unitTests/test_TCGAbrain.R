library(RUnit)
library(TCGAbrain)
library(jsonlite)
#----------------------------------------------------------------------------------------------------
Sys.setlocale("LC_ALL", "C")  # standardize alphabetic sort order
#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
runTests <- function(quiet=TRUE)
{
  testManifestAndDataConsistency(quiet)   # qc on the manifest and extdata: verify this before proceeding 
  testConstructor(quiet);
  testManifest(quiet)
  testMatrices(quiet)
  testDataFrames(quiet)
  testNetworks(quiet)
  testSubjectHistory(quiet)

  testGetItemWithSubsetting(quiet)

} # runTests
#----------------------------------------------------------------------------------------------------
# pass these tests before building the package: it reads from inst/extdata directly, using
# a relative pathnames
testManifestAndDataConsistency <- function(quiet=TRUE)
{
   printf("--- testManifestAndDataConsistency")
   dir <- "../extdata"
   if(!file.exists(dir))
       dir <- system.file(package="TCGAbrain", "extdata")
   
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkTrue(nrow(tbl) >= 7)
   checkEquals(ncol(tbl), 11)
   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   expected.rownames <- c("mtx.cn.RData", "tbl.history.RData", "mtx.mut.RData", "mtx.prot.RData",
                          "mtx.mrna.bc.RData", "markers.json.RData", "gbmPathways.json.RData")

   checkTrue(all(expected.rownames %in% rownames(tbl)))

   expected.classes <- c("data.frame", "json", "matrix")
   checkTrue(all(tbl$class %in% expected.classes))

   expected.categories <- unique(c("copy number", "subjectHistory", "mrna expression", "mutations", "network",
                                   "protein abundance"))

   checkTrue(all(expected.categories %in% tbl$category))
   

   for(i in 1:nrow(tbl)){
      file.name <- rownames(tbl)[i]
      full.name <- file.path(dir, file.name)
      variable.name <- tbl$variable[i]
      if(!grepl(".RData$", file.name))  # for example, do not load a json file
         next;
      checkEquals(load(full.name), variable.name)
        # get a handle on the variable, "x"
      eval(parse(text=sprintf("%s <- %s", "x", variable.name)))
      class <- tbl$class[i]
      category <- tbl$category[i]
      subcategory <- tbl$subcategory[i]
      entity.count <- tbl$entity.count[i]
      feature.count <- tbl$feature.count[i]
      checkEquals(class(x), class)
      if(class %in% c("matrix", "data.frame")){
         checkEquals(entity.count, nrow(x))
         checkEquals(feature.count, ncol(x))
         }
      if(class == "list"){
         checkEquals(entity.count, length(x))
         checkTrue(is.na(feature.count))
         }
      entity.type <- tbl$entity.type[i]
      feature.type <- tbl$feature.type[i]
      minValue <- tbl$minValue[i]
      maxValue <- tbl$maxValue[i]
      if(class == "matrix" && !is.na(minValue)){
         checkEqualsNumeric(min(x, na.rm=TRUE), minValue, tolerance=10e-5)
         checkEqualsNumeric(max(x, na.rm=TRUE), maxValue, tolerance=10e-5)
         }
      provenance <- tbl$provenance[i];
      checkTrue(nchar(provenance) > 0)
      } # for i

   TRUE
   
} # testManifestAndDataConsistency
#----------------------------------------------------------------------------------------------------
testConstructor <- function(quiet=TRUE)
{
   printf("--- testConstructor")
   dz <- TCGAbrain();
   checkTrue("Dataset" %in% is(dz))
   tbl.manifest <- getManifest(dz)
   checkTrue(nrow(tbl.manifest) >= 7)

      # should be as many items (and thus itemNames) as rows in the manifest
      # with one exception:  subjectHistory has a reserved slot in the class,
      # and is not stored in the item dictionary.  

   expected.item.count <- nrow(tbl.manifest)
   subjectHistory.rowCount <- length(grep("subjectHistory", tbl.manifest$category, ignore.case=TRUE))
   expected.item.count <- expected.item.count - subjectHistory.rowCount

   checkEquals(length(getItemNames(dz)), expected.item.count)
   classes <- sort(unique(tbl.manifest$class))

   matrix.variables <- subset(tbl.manifest, class=="matrix")$variable
   checkTrue(length(matrix.variables) > 0)
   for(name in matrix.variables){
      mtx <- getItem(dz, name)
      checkTrue("matrix" %in% is(mtx))
      checkTrue(nrow(mtx) > 0)
      checkTrue(ncol(mtx) > 0)
      if(!quiet) printf("    %s: %d x %d", name, nrow(mtx), ncol(mtx))
      }

   dataframe.variables <- subset(tbl.manifest, class=="data.frame" && category != "subjectHistory")$variable
   if(length(dataframe.variables > 0))
      for(name in dataframe.variables){
         tbl <- getItem(dz, name)
         checkTrue("data.frame" %in% is(tbl))
         checkTrue(nrow(tbl) > 0)
         checkTrue(ncol(tbl) > 0)
         if(!quiet) printf("    %s: %d x %d", name, nrow(tbl), ncol(tbl))
         } # if,for

} # testConstructor
#----------------------------------------------------------------------------------------------------
testManifest <- function(quiet=TRUE)
{
    printf("--- testManifest")
    dz <- TCGAbrain()
    tbl <- getManifest(dz)
    checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                 "entity.count", "feature.count", "entity.type",
                                 "feature.type", "minValue", "maxValue", "provenance"))
    checkTrue(nrow(tbl) >= 6)
    
} # testManifest
#----------------------------------------------------------------------------------------------------
testMatrices <- function(quiet=TRUE)
{
   printf("--- testMatrices")
   dz <- TCGAbrain()
   tbl.manifest <- getManifest(dz)
   matrix.names <- subset(tbl.manifest, class=="matrix")$variable
   checkTrue(all(matrix.names %in% getItemNames(dz)))

   for(name in matrix.names){
      mtx <- getItem(dz, name)
      checkTrue("matrix" %in% is(mtx))
      checkTrue(nrow(mtx) > 0)
      checkTrue(ncol(mtx) > 0)
      }

} # testMatrices
#--------------------------------------------------------------------------------
testDataFrames <- function(quiet=TRUE)
{
   printf("--- testDataFrames")
   dz <- TCGAbrain()
   tbl.manifest <- getManifest(dz)
   dataframe.names <- subset(tbl.manifest, class=="data.frame" & category != "subjectHistory")$variable
   checkTrue(all(dataframe.names %in% getItemNames(dz)))

   for(name in dataframe.names){
      tbl <- getItem(dz, name)
      checkTrue("data.frame" %in% is(tbl))
      checkTrue(nrow(tbl) > 0)
      checkTrue(ncol(tbl) > 0)
      }

} # testDataFrames
#--------------------------------------------------------------------------------
testNetworks <- function(quiet=TRUE)
{
   printf("--- testNetworks")

   dz <- TCGAbrain()
   tbl.manifest <- getManifest(dz)
   network.names <- subset(tbl.manifest, category=="network")$variable
   checkTrue(all(network.names %in% getItemNames(dz)))
      # get the item -- it's a character string, in json format.
      # fromJSON can read strings, turn the object into an R list, usually a named list of 
      # named lists.
      # then make sure this can be converted into a proper json object
      # todo: might want to handle networks -- that is, save them -- as serialized json
      # objects.  scripts in the utils directory of each data package, which use
      # the NetworkMaker class, could easily be modified to do so.

   for(name in network.names){
      item <- getItem(dz, name)
      checkTrue("json" %in% is(item))
      } # for name
    
} # testNetworks
#--------------------------------------------------------------------------------
# a standard slot in the DataSet class, which might be empty, might be constructed
# from a data.frame and/or an events list.  at present, the TCGAbrain SubjectHistory
# is created only from a tab-delimited file.
testSubjectHistory <- function(quiet=TRUE)
{
    printf("--- testSubjectHistory")
    dz <- TCGAbrain()
    checkTrue("SubjectHistory" %in% is(getSubjectHistory(dz)))
    tbl.history <- getTable(getSubjectHistory(dz))
    checkEquals(dim(tbl.history), c(1051, 7))

} # testSubjectHistory
#--------------------------------------------------------------------------------
testGetItemWithSubsetting <- function(quiet=TRUE)
{
    printf("--- testGetItemWithSubsetting")
    
    dz <- TCGAbrain()
      # get a name at random
    matrix.name <- subset(getManifest(dz), class=="matrix")$variable[1]
    mtx <- getItem(dz, matrix.name)
    checkTrue("matrix" %in% is(mtx))
    entities <- rownames(mtx)
    features <- colnames(mtx)
    set.seed(31)
    entities.sub <- c(entities[sample(1:length(entities), 5)], "bogusEntity")
    features.sub <- c(features[sample(1:length(features), 5)], "bogusFeature")
    checkEquals(length(entities.sub), 6)
    checkEquals(length(features.sub), 6)

    mtx.sub <- getItem(dz, matrix.name, entities.sub, features.sub)
    checkEquals(dim(mtx.sub), c(5,5))
    

} # testGetItemWithSubsetting
#--------------------------------------------------------------------------------
testSampleIdToSubjectId <- function()
{
   printf("--- testSampleIdToSubjectId - deferred pending refactoring")
   return(TRUE)
   #dp <- TCGAbrain()
   # <- names(getPatientList(dp))
   #ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

} # testCa
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
