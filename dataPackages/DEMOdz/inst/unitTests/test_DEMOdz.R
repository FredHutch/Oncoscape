library(RUnit)
library(DEMOdz)
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
       dir <- system.file(package="DEMOdz", "extdata")
   
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkTrue(nrow(tbl) >= 10)
   checkEquals(ncol(tbl), 11)
   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   expected.rownames <- c("mtx.mrna.ueArray.RData","mtx.mrna.bc.RData", "mtx.mut.RData", "mtx.cn.RData",
                          "mtx.meth.RData", "markers.json.RData")
   
   checkTrue(all(expected.rownames %in% rownames(tbl)))

<<<<<<< HEAD
   expected.classes <- c("data.frame", "matrix", "character", "json", "list")   # new ones may be added
=======
   expected.classes <- c("data.frame", "matrix", "character", "json")   # new ones may be added
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
   checkTrue(all(tbl$class %in% expected.classes))

   expected.categories <- unique(c("copy number", "subjectHistory","mRNA expression", "methylation",
                                   "mutations", "network", "protein abundance"))
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
      #printf("class: %s - %s", class, class(x))
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
   dz <- DEMOdz();
   checkTrue("Dataset" %in% is(dz))
   tbl.manifest <- getManifest(dz)
   checkTrue(nrow(tbl.manifest) >= 10)

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
    dz <- DEMOdz()
    tbl <- getManifest(dz)
    checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                 "entity.count", "feature.count", "entity.type",
                                 "feature.type", "minValue", "maxValue", "provenance"))
    checkTrue(nrow(tbl) > 8)
    
} # testManifest
#----------------------------------------------------------------------------------------------------
testMatrices <- function(quiet=TRUE)
{
   printf("--- testMatrices")
   dz <- DEMOdz()
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
   dz <- DEMOdz()
   tbl.manifest <- getManifest(dz)
   dataframe.names <- subset(tbl.manifest, class=="data.frame" & category != "subjectHistory")$variable
   checkTrue(all(dataframe.names %in% getItemNames(dz)))

   for(name in dataframe.names){
      tbl <- getItem(dz, name)
<<<<<<< HEAD
      checkTrue("data.frame" %in% is(tbl))
=======
      checkTrue("data.frame" %in% is(mtx))
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
      checkTrue(nrow(tbl) > 0)
      checkTrue(ncol(tbl) > 0)
      }

} # testDataFrames
#--------------------------------------------------------------------------------
testNetworks <- function(quiet=TRUE)
{
   printf("--- testNetworks")

   dz <- DEMOdz()
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
# from a data.frame and/or an events list.  at present, the DEMOdz SubjectHistory
# is created only from a tab-delimited file.
testSubjectHistory <- function(quiet=TRUE)
{
    printf("--- testSubjectHistory")
    dz <- DEMOdz()
    checkTrue("SubjectHistory" %in% is(getSubjectHistory(dz)))
    tbl.history <- getTable(getSubjectHistory(dz))
    checkEquals(dim(tbl.history), c(20, 7))

} # testSubjectHistory
#--------------------------------------------------------------------------------
testGetItemWithSubsetting <- function(quiet=TRUE)
{
    printf("--- testGetItemWithSubsetting")
    
    dz <- DEMOdz()
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
#testMutation <- function()
#{
#   printf("--- testMutation")
#
#   dir <- system.file(package="DEMOdz", "extdata")
#   checkTrue(file.exists(dir))
#   file <- file.path(dir, "mtx.mut.RData")
#   checkTrue(file.exists(file))
#
#   load(file)
#   checkTrue(exists("mtx.mut"))
#   checkTrue(is(mtx.mut, "matrix"))
#   checkEquals(dim(mtx.mut), c(20, 64))
#
#     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))
#
#     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
#   regex <- "^TCGA\\.[0-9][0-9]\\.[0-9][0-9][0-9][0-9]$"
#   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))
#
#     # contents should all be character
#   checkEquals(class(mtx.mut[1,1]), "character")
#
#
#} # testMutation
##----------------------------------------------------------------------------------------------------
#testCopyNumber <- function()
#{
#   printf("--- testCopyNumber")
#
#   dir <- system.file(package="DEMOdz", "extdata")
#   checkTrue(file.exists(dir))
#   file <- file.path(dir, "mtx.cn.RData")
#   checkTrue(file.exists(file))
#
#   load(file)
#   checkTrue(exists("mtx.cn"))
#   checkTrue(is(mtx.cn, "matrix"))
#   checkEquals(dim(mtx.cn), c(20, 64))
#
#     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.cn) %in% keys(org.Hs.egSYMBOL2EG)))
#
#     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
#   regex <- "^TCGA\\.[0-9][0-9]\\.[0-9][0-9][0-9][0-9]$"
#   checkEquals(length(grep(regex, rownames(mtx.cn))), nrow(mtx.cn))
#
#     # contents should all be integer
#   checkTrue(is(mtx.cn[1,1], "integer"))
#
#     # only legit gistic values
#   checkEquals(sort(unique(as.integer(mtx.cn))), c(-2, -1, 0, 1, 2))
#
#} # testCopyNumber
##----------------------------------------------------------------------------------------------------
#testProteinAbundance <- function()
#{
#   printf("--- testProteinAbundance")
#
##   dir <- system.file(package="DEMOdz", "extdata")
##   checkTrue(file.exists(dir))
##   file <- file.path(dir, "mtx.prot.RData")
##   checkTrue(file.exists(file))
#
##   load(file)
##   checkTrue(exists("mtx.prot"))
##   checkTrue(is(mtx.prot, "matrix"))
##   checkEquals(class(mtx.prot[1,1]), "numeric")
#
##   checkEquals(dim(mtx.prot), c(260, 189))
#
#     # a reasonable range of expression log2 ratios
##   checkEquals(fivenum(mtx.prot), c(-5.49454639, -0.64817849, -0.08121155,  0.56151266,  9.79907304))
#   
#     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
##   checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))
#
#     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
##   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
##   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))
#
#} # testExpression
##----------------------------------------------------------------------------------------------------
#testMethylation <- function()
#{
#   printf("--- testMethylation")
#
##   dir <- system.file(package="DEMOdz", "extdata")
##   checkTrue(file.exists(dir))
##   file <- file.path(dir, "mtx.meth.RData")
##   checkTrue(file.exists(file))
#
##   load(file)
##   checkTrue(exists("mtx.meth"))
##   checkTrue(is(mtx.meth, "matrix"))
##   checkEquals(class(mtx.meth[1,1]), "numeric")
#
##   checkEquals(dim(mtx.meth), c(530, 16223))
#
#     # a reasonable range of expression log2 ratios
##   checkEquals(fivenum(mtx.meth), c(0.004862255, 0.052114764, 0.397865738, 0.841466552, 0.995080719))
#   
#     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
##   checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))
#
#     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
##   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
##   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))
#
#} # testExpression
#
##----------------------------------------------------------------------------------------------------
##----------------------------------------------------------------------------------------------------
#testHistoryTable <- function()
#{
#   printf("--- testHistoryTable - deferred until PatientHistory is refactored")
#   return()
#   
#   dz <- DEMOdz()
#   tbl <- getTable(history(dp))
#   checkEquals(dim(tbl), c(20, 162))
#
#      # our old columns
##   basic.columns <-  c("ID", "ageAtDx", "FirstProgression", "survival", 
##                       "ChemoAgent", "DOB", "Diagnosis", "RadiationStart", 
##                       "RadiationStop", "RadiationTarget", "ChemoStartDate",
##                       "ChemoStopDate", "Death")
#
##   new.columns.of.interest <- c("ptID", "DOB.date", "DOB.gender",
##                                "Progression.event", "Progression.date",
##                                "Status.date", "Status.status")
#
#   checkEquals(colnames(tbl)[1:10], 
#           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
#             "Drug.date1", "Drug.date2", "Drug.therapyType"))
#   checkEquals(unique(tbl$study), "TCGAgbm")
#   checkEquals(as.character(tbl[1,1]), "TCGA.02.0014")
##           c("TCGA.02.0014","8", "TCGAgbm", "05/09/1971", "male", "white", "not hispanic or latino", "06/08/2003", NA, "Chemotherapy"))
#   checkEquals(tbl["TCGA.02.0014","Survival"], 2512)
#   checkEquals(tbl["TCGA.02.0014", "AgeDx"], 9369)
#   checkEquals(tbl["TCGA.02.0014", "TimeFirstProgression"], 2243)
#
#
#} # testHistoryTable
##----------------------------------------------------------------------------------------------------
#testSampleCategories <- function()
#{
#   printf("--- testSampleCategories")
#   ddz <- DEMOdz()
#   expected <- c("tbl.glioma8", "tbl.verhaakPlus1")
#   checkTrue(all(expected %in% getSampleCategorizationNames(ddz)))
#   tbl.1 <- getSampleCategorization(ddz, expected[1])
#   tbl.2 <- getSampleCategorization(ddz, expected[2])
#   checkEquals(colnames(tbl.1), c("cluster", "color"))
#   checkEquals(colnames(tbl.2), c("cluster", "color"))
#   checkTrue(nrow(tbl.1) > 400)
#   checkTrue(nrow(tbl.2) > 400)
#
#} # testSampleCategories
#----------------------------------------------------------------------------------------------------
testSampleIdToSubjectId <- function()
{
   printf("--- testSampleIdToSubjectId - deferred pending refactoring")
   return(TRUE)
   #dp <- DEMOdz()
   # <- names(getPatientList(dp))
   #ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

} # testCa
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
