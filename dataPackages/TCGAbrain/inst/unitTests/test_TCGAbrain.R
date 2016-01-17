library(RUnit)
library(TCGAbrain)
<<<<<<< HEAD
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
   
=======
library(org.Hs.eg.db)
#----------------------------------------------------------------------------------------------------
Sys.setlocale("LC_ALL", "C")   ## to prevent issues with different sort calls (3/3/15)
#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a TCGAbrain data package

  testConstructor();
  testManifest()
  testCopyNumber()
  testHistoryList()
  testHistoryTable()
  testExpression()
  testMutation() 
  testMethylation() 
  testProteinAbundance() 
  testSampleCategories()

    # the following tests address the -use- of this class by client code

  testMatrixAndDataframeAccessors()
  testCanonicalizePatientIDs()
  
} # runTests
#--------------------------------------------------------------------------------
testManifest <- function()
{
   printf("--- testManifest")
   dir <- system.file(package="TCGAbrain", "extdata")
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
<<<<<<< HEAD
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
   
=======
   checkEquals(ncol(tbl),  11)
   checkTrue(nrow(tbl) >= 8)
   expected.colnames <- c("variable", "class", "category", "subcategory",
                           "entity.count", "feature.count", "entity.type",
                           "feature.type", "minValue", "maxValue", "provenance")

   checkTrue(all(expected.colnames %in% colnames(tbl)))
 
   expected.categories <- c("copy number", "history", "mutations", "protein abundance",
                            "mrna expression", "network", "geneset")
   checkTrue(all(expected.categories %in% tbl$category))
   expected.rownames <- c("mtx.cn.RData", "events.RData","ptHistory.RData","historyTypes.RData", "mtx.mut.RData", "mtx.prot.RData",
                          "mtx.mrna.bc.RData", "markers.json.RData",
                          "genesets.RData")
   checkTrue(all(expected.rownames %in% rownames(tbl)))

   expected.classes <- c("character", "list", "matrix")
   checkTrue(all(expected.classes %in% tbl$class));
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261

   for(i in 1:nrow(tbl)){
      file.name <- rownames(tbl)[i]
      full.name <- file.path(dir, file.name)
      variable.name <- tbl$variable[i]
<<<<<<< HEAD
      if(!grepl(".RData$", file.name))  # for example, do not load a json file
         next;
      checkEquals(load(full.name), variable.name)
=======
      loaded.name <- load(full.name)
      #printf("variable.name: %s", variable.name)
      checkEquals(loaded.name, variable.name)
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
        # get a handle on the variable, "x"
      eval(parse(text=sprintf("%s <- %s", "x", variable.name)))
      class <- tbl$class[i]
      category <- tbl$category[i]
      subcategory <- tbl$subcategory[i]
      entity.count <- tbl$entity.count[i]
      feature.count <- tbl$feature.count[i]
<<<<<<< HEAD
      #printf("class: %s - %s", class, class(x))
=======
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
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
<<<<<<< HEAD
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
=======
         checkEqualsNumeric(min(x, na.rm=T), minValue, tolerance=10e-5)
         checkEqualsNumeric(max(x, na.rm=T), maxValue, tolerance=10e-5)
         }
       } # for i
   
   TRUE
   
} # testManifest
#----------------------------------------------------------------------------------------------------
testExpression <- function()
{
   printf("--- testExpression")

   dir <- system.file(package="TCGAbrain", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mrna.bc.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna.bc"))
   checkTrue(is(mtx.mrna.bc, "matrix"))
   checkEquals(class(mtx.mrna.bc[1,1]), "numeric")

   checkEquals(dim(mtx.mrna.bc), c(654, 18641))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna.bc), c(-0.7501015, 0.4935667, 1.0289391, 1.5074960, 2.8348106), tolerance=1e-5)
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
 #  checkTrue(all(colnames(mtx.mrna.bc) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mrna.bc))), nrow(mtx.mrna.bc))

} # testExpression
#--------------------------------------------------------------------------------
testMutation <- function()
{
   printf("--- testMutation")

   dir <- system.file(package="TCGAbrain", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mut.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mut"))
   checkTrue(is(mtx.mut, "matrix"))
   checkEquals(dim(mtx.mut), c(580, 9789))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
     # deferred for now: see unmapped names below
     # checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))
     #
     # 178 are NOT recognized gene symbols.  for intances
     # [1] "C20ORF27"  "C22ORF24"  "C3ORF67"   "CXORF22"  
     #  [5] "GPR133"    "C7ORF57"   "C12ORF43"  "CXORF57"  
     #  [9] "C7ORF65"   "GPR98"     "C3ORF17"   "C10ORF12" 
     # [13] "GPR64"     "C17ORF53"  "C12ORF77"  "C17ORF47" 
     # [17] "GPR116"    "C5ORF34"   "C9ORF171"  "C11ORF63" 
     # [21] "KIAA1244"  "C18ORF8"   "C11ORF94"  "C10ORF53" 
     # [25] "GPR112"    "C1ORF177"  "C5ORF46"   "C20ORF85" 
     # [29] "C9ORF84"   "EMR3"      "C9ORF131"  "C12ORF42" 

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))


} # testMutation
#--------------------------------------------------------------------------------
testCopyNumber <- function()
{
   printf("--- testCopyNumber")

   dir <- system.file(package="TCGAbrain", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.cn.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.cn"))
   checkTrue(is(mtx.cn, "matrix"))
   checkEquals(dim(mtx.cn), c(1076, 25319))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.cn) %in% keys(org.Hs.egSYMBOL2EG)))
# this data includes miRNA and other genes

     # all rownames should follow "TCGA.02.0014.01" format
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.cn))), nrow(mtx.cn))

     # contents should all be integer
   checkTrue(is(mtx.cn[1,1], "integer"))

     # only legit gistic values
   checkEquals(sort(unique(as.integer(mtx.cn))), c(-2, -1, 0, 1, 2))

} # testCopyNumber
#----------------------------------------------------------------------------------------------------
testProteinAbundance <- function()
{
   printf("--- testProteinAbundance")

   dir <- system.file(package="TCGAbrain", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.prot.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.prot"))
   checkTrue(is(mtx.prot, "matrix"))
   checkEquals(class(mtx.prot[1,1]), "numeric")

   checkEquals(dim(mtx.prot), c(474, 264))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.prot), c(-5.62437370, -0.63164617, -0.08118609,  0.54996781, 10.30523290))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
     # checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$"
   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))

} # testProteinAbundance
#----------------------------------------------------------------------------------------------------
testMethylation <- function()
{
   printf("--- testMethylation")

#   dir <- system.file(package="TCGAbrain", "extdata")
#   checkTrue(file.exists(dir))
#   file <- file.path(dir, "mtx.meth.RData")
#   checkTrue(file.exists(file))

#   load(file)
#   checkTrue(exists("mtx.meth"))
#   checkTrue(is(mtx.meth, "matrix"))
#   checkEquals(class(mtx.meth[1,1]), "numeric")

#   checkEquals(dim(mtx.meth), c(818, 17267))

     # a reasonable range of expression log2 ratios
#   checkEquals(fivenum(mtx.meth), c(0.00000000, 0.04630122, 0.24321623, 0.80151050, 0.99790393), tolerance=10e-5)
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
     # checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
#   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$"
#   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))

} # testMethylation
#--------------------------------------------------------------------------------
testConstructor <- function()
{
   printf("--- testConstructor")

   dp <- TCGAbrain();
   checkEquals(ncol(manifest(dp)), 11)
   checkTrue(nrow(manifest(dp)) >= 8)
   checkTrue(length(matrices(dp)) >= 4)
   expected.matrices <- c("mtx.cn", "mtx.mut", "mtx.prot", "mtx.mrna.bc")
   checkTrue(all(expected.matrices %in% names(matrices(dp))))
   checkTrue(eventCount(history(dp)) > 10000)
   
} # testConstructor
#--------------------------------------------------------------------------------
testMatrixAndDataframeAccessors <- function()
{
   printf("--- testMatrixAndDataframeAccessors")
   dp <- TCGAbrain();
   checkTrue("mtx.cn" %in% names(matrices(dp)))
   samples <- head(entities(dp, "mtx.cn"), n=3)
   checkEquals(samples, c("TCGA.02.0001.01", "TCGA.02.0003.01", "TCGA.02.0006.01"))
    

} # testMatrixAndDataframeAccessors
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   printf("--- testHistoryList")
   dp <- TCGAbrain();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- geteventList(ptHistory)
   checkEquals(length(events), 12543)
    
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(Absent=448,
                    Background=1051,
                    Birth=1051,
                    Diagnosis=1051,
                    Drug=1965,
                    Encounter=2124,
                    Pathology=1067,
                    Procedure=323,
                    Progression=542,
                    Radiation=819,
                    Status=1051,
                    Tests=1051))

} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   printf("--- testHistoryTable")
   dp <- TCGAbrain();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(1051, 485))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), c("TCGAgbm", "TCGAlgg"))
   checkEquals(as.character(events[1,4]),"09/15/1957")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("358", "16179", "137"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
testSampleCategories <- function()
{
   printf("--- testSampleCategories")
   dz <- TCGAbrain()
   expected <- c("tbl.glioma8", "tbl.verhaakPlus1")
   checkTrue(all(expected %in% getSampleCategorizationNames(dz)))
   tbl.1 <- getSampleCategorization(dz, expected[1])
   tbl.2 <- getSampleCategorization(dz, expected[2])
   checkEquals(colnames(tbl.1), c("cluster", "color"))
   checkEquals(colnames(tbl.2), c("cluster", "color"))
   checkTrue(nrow(tbl.1) > 400)
   checkTrue(nrow(tbl.2) > 400)

} # testSampleCategories
#----------------------------------------------------------------------------------------------------
testCanonicalizePatientIDs <- function()
{
   printf("--- testCanonicalizePatientIDs")
   dp <- TCGAbrain()
   IDs <- names(getPatientList(dp))
   ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

}
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
