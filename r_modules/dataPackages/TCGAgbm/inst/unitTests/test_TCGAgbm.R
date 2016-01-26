library(RUnit)
library(TCGAgbm)
library(org.Hs.eg.db)
Sys.setlocale("LC_ALL", "C")
  ## to prevent issues with different sort calls (3/3/15)
#--------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#--------------------------------------------------------------------------------
runTests <- function()
{
    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a TCGAgbm data package

  printf("=== test_TCGAgbm.R, runTests()")
  testConstructor();
  testManifest()
  testCopyNumber()
  testHistoryList()
  testHistoryTable()
  testExpression()
  testMutation() 
#  testMethylation() 
  testProteinAbundance() 
  testSampleCategories()
  testCanonicalizePatientIDs()
  testGeneSets()
  testNetworks()
  
    # the following tests address the -use- of this class by client code

  testMatrixAndDataframeAccessors()
  
} # runTests
#--------------------------------------------------------------------------------
testConstructor <- function()#
{
   printf("--- testConstructor")

   dp <- TCGAgbm();
   checkEquals(ncol(manifest(dp)), 11)
   checkTrue(nrow(manifest(dp)) >= 9)
   checkTrue(length(matrices(dp)) >= 5)
   checkTrue(eventCount(history(dp)) > 7000)
   
} # testConstructor
#--------------------------------------------------------------------------------
testManifest <- function()
{
   printf("--- testManifest")
   dir <- system.file(package="TCGAgbm", "extdata")
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkEquals(ncol(tbl), 11)
   checkTrue(nrow(tbl) >= 9)
   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   expected.categories <- c("copy number", "history", "mRNA expression","mRNA expression", "mutations",
                               "protein abundance", "network", "geneset")
   checkTrue(all(expected.categories %in% tbl$category))
   
   expected.rownames <- c("mtx.cn.RData", "events.RData","ptHistory.RData","historyTypes.RData",
                          "mtx.mrna.RData", "mtx.mrna.ueArray.RData", "mtx.mut.RData",
                          "mtx.prot.RData", "markers.json.RData", "genesets.RData")
   checkTrue(all(expected.rownames %in% rownames(tbl)))
   expected.classes <- c("character", "list", "matrix")
   checkTrue(all(expected.classes %in% tbl$class))
   provenance <- tbl$provenance;
   expected.provenance <- c("tcga cBio","tcga","tcga","tcga","tcga","tcga cBio","tcga cBio","tcga cBio","tcga cBio",
                            "TCGA","marker.genes.545, tcga.GBM.classifiers",
                            "manual curation by Hamid Bolouri","5 clusters; Verhaak 2010 + G-CIMP")
   checkTrue(all(expected.provenance %in% provenance))

   for(i in 1:nrow(tbl)){
      file.name <- rownames(tbl)[i]
      full.name <- file.path(dir, file.name)
      variable.name <- tbl$variable[i]
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
         checkEqualsNumeric(min(x, na.rm=T), minValue, tolerance=10e-4)
         checkEqualsNumeric(max(x, na.rm=T), maxValue, tolerance=10e-4)
         }
    
      } # for i

   TRUE
   
} # testManifest
#----------------------------------------------------------------------------------------------------
testExpression <- function()
{
   printf("--- testExpression")

   dir <- system.file(package="TCGAgbm", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mrna.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna"))
   checkTrue(is(mtx.mrna, "matrix"))
   checkEquals(class(mtx.mrna[1,1]), "numeric")

   checkEquals(dim(mtx.mrna), c(154, 20457))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna), c(-5.6790,   -0.5956,   -0.2237,    0.3674, 3359.2622))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mrna) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.[0-9][0-9][0-9][0-9]\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mrna))), nrow(mtx.mrna))

} # testExpression
#--------------------------------------------------------------------------------
testMutation <- function()
{
   printf("--- testMutation")

   dir <- system.file(package="TCGAgbm", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mut.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mut"))
   checkTrue(is(mtx.mut, "matrix"))
   checkEquals(dim(mtx.mut), c(291, 6698))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.[0-9][0-9][0-9][0-9]\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))

     # contents should all be character, now factors
     checkTrue(all(unlist(lapply(mtx.mut, function(row){class(row)}), use.names=FALSE) == "character"))
     

} # testMutation
#--------------------------------------------------------------------------------
testCopyNumber <- function()
{
   printf("--- testCopyNumber")

   dir <- system.file(package="TCGAgbm", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.cn.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.cn"))
   checkTrue(is(mtx.cn, "matrix"))
   checkEquals(dim(mtx.cn), c(563,23575))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.cn) %in% keys(org.Hs.egSYMBOL2EG)))
# this data includes miRNA and other genes

     # all rownames should follow "TCGA.02.0014.01" format
   regex <- "^TCGA\\.\\w\\w\\.[0-9][0-9][0-9][0-9]\\.[0-9][0-9]$"
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

   dir <- system.file(package="TCGAgbm", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.prot.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.prot"))
   checkTrue(is(mtx.prot, "matrix"))
   checkEquals(class(mtx.prot[1,1]), "numeric")

   checkEquals(dim(mtx.prot), c(214, 171))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.prot), c(-5.6243737, -0.6122669, -0.0811811,  0.5379014, 10.3052329))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
     #regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w"
   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))

} # testProteinAbundance
#----------------------------------------------------------------------------------------------------
testMethylation <- function()
{
#   printf("--- testMethylation")

#   dir <- system.file(package="TCGAgbm", "extdata")
#   checkTrue(file.exists(dir))
#   file <- file.path(dir, "mtx.meth.RData")
#   checkTrue(file.exists(file))

#   load(file)
#   checkTrue(exists("mtx.meth"))
#   checkTrue(is(mtx.meth, "matrix"))
#   checkEquals(class(mtx.meth[1,1]), "numeric")

#   checkEquals(dim(mtx.meth), c(288, 9444))

     # a reasonable range of expression log2 ratios
   #checkEquals(fivenum(mtx.meth), c(0.00000000, 0.03695173, 0.08300117, 0.44657442, 0.99790393))
#   checkEquals(fivenum(mtx.meth), c(0.00000, 0.03695, 0.08300, 0.44657, 0.99790))
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
     #regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
#   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w"
#   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))

} # testExpression
#--------------------------------------------------------------------------------
testMatrixAndDataframeAccessors <- function()
{
   printf("--- testMatrixAndDataframeAccessors")
   dp <- TCGAgbm();
   checkTrue("mtx.cn" %in% names(matrices(dp)))
   samples <- head(entities(dp, "mtx.cn"), n=3)
   checkEquals(samples, c("TCGA.02.0001.01", "TCGA.02.0003.01", "TCGA.02.0006.01"))
    

} # testMatrixAndDataframeAccessors
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   printf("--- testHistoryList")
   dp <- TCGAgbm();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- geteventList(ptHistory)
   checkEquals(length(events), 7644)
    
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(Absent=328,
                    Background=592,
                    Birth=592,
                    Diagnosis=592,
                    Drug=1467,
                    Encounter=1227,
                    Pathology=594,
                    Procedure=142,
                    Progression=388,
                    Radiation=538,
                    Status=592,
                    Tests=592))

} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   printf("--- testHistoryTable")
   dp <- TCGAgbm();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(592, 425))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), "TCGAgbm")
   checkEquals(as.character(events[1,4]),"09/15/1957")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("358", "16179", "137"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
testSampleCategories <- function()
{
   printf("--- testSampleCategories")
   dz <- TCGAgbm()
   expected <- c("tbl.verhaakPlus1")
   checkTrue(all(expected %in% getSampleCategorizationNames(dz)))
   tbl.1 <- getSampleCategorization(dz, expected[1])
   checkEquals(colnames(tbl.1), c("cluster", "color"))
   checkTrue(nrow(tbl.1) > 400)

} # testSampleCategories
#----------------------------------------------------------------------------------------------------
testGeneSets <- function()
{
   printf("--- testGeneSets")
   dz <- TCGAgbm()
   expected <- c("tcga.GBM.classifiers","marker.genes.545") 
   checkTrue(all(expected %in% getGeneSetNames(dz)))
   
   geneSymbols <- getGeneSetGenes(dz, expected[1])
   checkEquals(length(geneSymbols), 840)

   geneSymbols <- getGeneSetGenes(dz, expected[2])
   checkEquals(length(geneSymbols), 545)


} # testGeneSets
#----------------------------------------------------------------------------------------------------
testNetworks <- function()
{
   printf("--- testNetworks")
   dz <- TCGAgbm()
   expected <- c("g.markers.json", "g.gbmPathways.json") 
   checkTrue(all(expected %in% names(networks(dz))))

	checkTrue(nchar(networks(dz)[["g.markers.json"]]) > 0 )
	checkTrue(nchar(networks(dz)[["g.gbmPathways.json"]]) > 0 )
	
} # testNetworks

#----------------------------------------------------------------------------------------------------
testCanonicalizePatientIDs <- function()
{
   printf("--- testCanonicalizePatientIDs")
   dp <- TCGAgbm()
   IDs <- names(getPatientList(dp))
   ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

   ptIDs <-  c("TCGA.HT.A4DV", "TCGA.E1.5311", "TCGA.F6.A8O4", "TCGA.HT.8113", "TCGA.HT.8109", "TCGA.DU.A6S6")
   specimenIDs <- c("TCGA.HT.A4DV.01", "TCGA.E1.5311.01", "TCGA.F6.A8O4.01", "TCGA.HT.8113.01", "TCGA.HT.8109.01", "TCGA.DU.A6S6.01")

   checkEquals(ptIDs, canonicalizePatientIDs(dp, ptIDs))
   checkEquals(ptIDs, canonicalizePatientIDs(dp, specimenIDs))

}
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
