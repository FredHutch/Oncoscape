library(RUnit)
library(DEMOdz)
library(org.Hs.eg.db)

# standardize alphabetic sort order
Sys.setlocale("LC_ALL", "C")
#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  printf("=== test_DEMOdz.R, runTests()")

    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a DEMOdz data package
  testManifest()
  testExpression1()
  testExpression1()
  testCopyNumber()
  testMutation() 
  testHistoryList()
  testHistoryTable()
#  testMethylation() 
#  testProteinAbundance() 

    # the following tests address the -use- of this class by client code
  testConstructor();
  testMatrixAndDataframeAccessors()
  testNetworks()
  testSampleCategories()
  testCanonicalizePatientIDs()

} # runTests
#----------------------------------------------------------------------------------------------------
testManifest <- function()
{
   printf("--- testManifest")
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
                          "events.RData","ptHistory.RData","historyTypes.RData", "tbl.ptHistory.RData", "mtx.prot.RData",
                          "mtx.meth.RData", "genesets.RData", "markers.json.RData")
   
   checkTrue(all(expected.rownames %in% rownames(tbl)))

   expected.classes <- c("data.frame", "list", "matrix", "character", "json")   # new ones may be added
   checkTrue(all(tbl$class %in% expected.classes))

   expected.categories <- unique(c("copy number", "geneset", "history","mRNA expression", "methylation",
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
      printf("class: %s - %s", class, class(x))
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
      # checkTrue(grepl("tcga", provenance))
      } # for i

   TRUE
   
} # testManifest
#----------------------------------------------------------------------------------------------------
testExpression1 <- function()
{
   printf("--- testExpression")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mrna.ueArray.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna.ueArray"))
   checkTrue(is(mtx.mrna.ueArray, "matrix"))
   checkEquals(class(mtx.mrna.ueArray[1,1]), "numeric")

   checkEquals(dim(mtx.mrna.ueArray), c(20, 64))

     # should be no NAs.  won't always be the case...
   checkEquals(length(which(is.na(mtx.mrna.ueArray))), 0)

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna.ueArray), c(-4.098870, -0.747000, -0.012800,  0.718805,  5.870990))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
   checkTrue(all(colnames(mtx.mrna.ueArray) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.[0-9][0-9]\\.[0-9][0-9][0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mrna.ueArray))), nrow(mtx.mrna.ueArray))

} # testExpression
#----------------------------------------------------------------------------------------------------
testExpression2 <- function()
{
   printf("--- testExpression")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mrna.bc.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna.bc"))
   checkTrue(is(mtx.mrna.bc, "matrix"))
   checkEquals(class(mtx.mrna.bc[1,1]), "numeric")

   checkEquals(dim(mtx.mrna.bc), c(141, 64))

     # should be no NAs.  won't always be the case...
   checkEquals(length(which(is.na(mtx.mrna.bc))), 0)

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna.bc), c(-0.234010,  0.837845,  1.340940,  1.733705,  2.409100))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
   checkTrue(all(colnames(mtx.mrna.bc) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.[0-9][0-9]\\.[0-9][0-9][0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mrna.bc))), nrow(mtx.mrna.bc))

} # testExpression
#--------------------------------------------------------------------------------
testMutation <- function()
{
   printf("--- testMutation")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mut.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mut"))
   checkTrue(is(mtx.mut, "matrix"))
   checkEquals(dim(mtx.mut), c(20, 64))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
   checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.[0-9][0-9]\\.[0-9][0-9][0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))

     # contents should all be character
   checkEquals(class(mtx.mut[1,1]), "character")


} # testMutation
#----------------------------------------------------------------------------------------------------
testCopyNumber <- function()
{
   printf("--- testCopyNumber")

   dir <- system.file(package="DEMOdz", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.cn.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.cn"))
   checkTrue(is(mtx.cn, "matrix"))
   checkEquals(dim(mtx.cn), c(20, 64))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
   checkTrue(all(colnames(mtx.cn) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.[0-9][0-9]\\.[0-9][0-9][0-9][0-9]$"
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

#   dir <- system.file(package="DEMOdz", "extdata")
#   checkTrue(file.exists(dir))
#   file <- file.path(dir, "mtx.prot.RData")
#   checkTrue(file.exists(file))

#   load(file)
#   checkTrue(exists("mtx.prot"))
#   checkTrue(is(mtx.prot, "matrix"))
#   checkEquals(class(mtx.prot[1,1]), "numeric")

#   checkEquals(dim(mtx.prot), c(260, 189))

     # a reasonable range of expression log2 ratios
#   checkEquals(fivenum(mtx.prot), c(-5.49454639, -0.64817849, -0.08121155,  0.56151266,  9.79907304))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
#   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
#   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))

} # testExpression
#----------------------------------------------------------------------------------------------------
testMethylation <- function()
{
   printf("--- testMethylation")

#   dir <- system.file(package="DEMOdz", "extdata")
#   checkTrue(file.exists(dir))
#   file <- file.path(dir, "mtx.meth.RData")
#   checkTrue(file.exists(file))

#   load(file)
#   checkTrue(exists("mtx.meth"))
#   checkTrue(is(mtx.meth, "matrix"))
#   checkEquals(class(mtx.meth[1,1]), "numeric")

#   checkEquals(dim(mtx.meth), c(530, 16223))

     # a reasonable range of expression log2 ratios
#   checkEquals(fivenum(mtx.meth), c(0.004862255, 0.052114764, 0.397865738, 0.841466552, 0.995080719))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
#   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
#   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))

} # testExpression

#----------------------------------------------------------------------------------------------------
testConstructor <- function()
{
   printf("--- testConstructor")

   dp <- DEMOdz();
   checkTrue(nrow(manifest(dp)) >= 10)
   checkTrue(length(matrices(dp)) >= 6)
  
   expected.matrix.names <- c("mtx.mrna.ueArray", "mtx.mrna.bc", "mtx.mut", "mtx.cn", "mtx.prot", "mtx.meth")
   checkTrue(all(expected.matrix.names %in% names(matrices(dp))))
   # checkTrue(eventCount(history(dp)) > 100)
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
testMatrixAndDataframeAccessors <- function()
{
#   printf("--- testMatrixAndDataframeAccessors")
#   dp <- DEMOdz();
#   checkTrue("mtx.mrna" %in% names(matrices(dp)))
#   samples <- head(entities(dp, "mtx.mrna"), n=3)
#   checkEquals(samples, c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"))
    

} # testMatrixAndDataframeAccessors
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   printf("--- testHistoryList: temporarily disabled as SubjectHistory class is completed")
   return();
   dp <- DEMOdz();
   checkTrue("history" %in% manifest(dp)$variable)
   records <- history(dp)

   events <- geteventList(records)
   checkEquals(length(events), 201)
   
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
    checkEquals(event.counts,
               list(Absent=9,
                    Birth=20,
                    Diagnosis=20,
                    Drug=41,
                    Encounter=39,
                    Pathology=20,
                    Procedure=5,
                    Progression=12,
                    Radiation=15,
                    Status=20))


} # testHistory
#----------------------------------------------------------------------------------------------------
testHistoryTable <- function()
{
   printf("--- testHistoryTable - deferred until PatientHistory is refactored")
   return()
   
   dp <- DEMOdz()
   tbl <- getTable(history(dp))
   checkEquals(dim(tbl), c(20, 162))

      # our old columns
#   basic.columns <-  c("ID", "ageAtDx", "FirstProgression", "survival", 
#                       "ChemoAgent", "DOB", "Diagnosis", "RadiationStart", 
#                       "RadiationStop", "RadiationTarget", "ChemoStartDate",
#                       "ChemoStopDate", "Death")

#   new.columns.of.interest <- c("ptID", "DOB.date", "DOB.gender",
#                                "Progression.event", "Progression.date",
#                                "Status.date", "Status.status")

   checkEquals(colnames(tbl)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(tbl$study), "TCGAgbm")
   checkEquals(as.character(tbl[1,1]), "TCGA.02.0014")
#           c("TCGA.02.0014","8", "TCGAgbm", "05/09/1971", "male", "white", "not hispanic or latino", "06/08/2003", NA, "Chemotherapy"))
   checkEquals(tbl["TCGA.02.0014","Survival"], 2512)
   checkEquals(tbl["TCGA.02.0014", "AgeDx"], 9369)
   checkEquals(tbl["TCGA.02.0014", "TimeFirstProgression"], 2243)


} # testHistoryTable
#----------------------------------------------------------------------------------------------------
testNetworks <- function()
{
   printf("--- testNetworks")
   ddz <- DEMOdz()
   networks <- networks(ddz)
   checkTrue(length(networks) >= 1)
   checkTrue("g.markers.json" %in% names(networks))
   g.markers.json <- networks$g.markers.json
   checkTrue(nchar(g.markers.json) > 20000)

} # testNetworks
#----------------------------------------------------------------------------------------------------
testSampleCategories <- function()
{
   printf("--- testSampleCategories")
   ddz <- DEMOdz()
   expected <- c("tbl.glioma8", "tbl.verhaakPlus1")
   checkTrue(all(expected %in% getSampleCategorizationNames(ddz)))
   tbl.1 <- getSampleCategorization(ddz, expected[1])
   tbl.2 <- getSampleCategorization(ddz, expected[2])
   checkEquals(colnames(tbl.1), c("cluster", "color"))
   checkEquals(colnames(tbl.2), c("cluster", "color"))
   checkTrue(nrow(tbl.1) > 400)
   checkTrue(nrow(tbl.2) > 400)

} # testSampleCategories
#----------------------------------------------------------------------------------------------------
testCanonicalizePatientIDs <- function()
{
   print("--- testCanonicalizePatientIDs - deferred pending refactoring")
   return(TRUE)
   dp <- DEMOdz()
   IDs <- names(getPatientList(dp))
   ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

}
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
