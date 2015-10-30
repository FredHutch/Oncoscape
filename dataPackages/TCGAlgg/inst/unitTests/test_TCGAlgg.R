library(RUnit)
library(TCGAlgg)
library(org.Hs.eg.db)
Sys.setlocale("LC_ALL", "C")
  ## to prevent issues with different sort calls (3/3/15)
#--------------------------------------------------------------------------------
runTests <- function()
{
    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a TCGAlgg data package
  testManifest()
  testCopyNumber()
  testHistoryList()
  testHistoryTable()
  testExpression()
  testMutation() 
  testMethylation() 
  testProteinAbundance() 
    # the following tests address the -use- of this class by client code

  testConstructor();
  testMatrixAndDataframeAccessors()
  
} # runTests
#--------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")

   dp <- TCGAlgg();
   checkEquals(ncol(manifest(dp)), 11)
   checkTrue(nrow(manifest(dp)) >= 7)
   checkTrue(length(matrices(dp)) >= 5)
   checkTrue(eventCount(history(dp)) > 4800)
   
} # testConstructor
#--------------------------------------------------------------------------------
testManifest <- function()
{
   print("--- testManifest")
   dir <- system.file(package="TCGAlgg", "extdata")
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkEquals(ncol(tbl), 11)
   checkTrue(nrow(tbl) >= 7)

   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   expected.categories <- c("copy number", "history", "mRNA expression", "mutations",
                               "protein abundance")
   checkTrue(all(expected.categories %in% tbl$category))

   expected.rownames <- c("mtx.cn.RData" ,"events.RData" ,"ptHistory.RData" ,
                          "historyTypes.RData" ,"tbl.ptHistory.RData","mtx.mrna.RData",
                          "mtx.mrna.bc.RData","mtx.mut.RData","mtx.prot.RData",
                          "mtx.meth.RData","genesets.RData")
   checkTrue(all(expected.rownames %in% rownames(tbl)))

   provenance <- tbl$provenance;
   expected.provenance <- c("tcga cBio","tcga","tcga","tcga","tcga","tcga cBio",
                            "ucsc 2/24/15; RNAseq; combat adjusted normalization for batch effects",
                            "tcga cBio","tcga cBio",
                            "tcga cBio; one probe per gene- most anti-correlated with expression",
                            "marker.genes.545, tcga.GBM.classifiers")
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
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   print("--- testHistoryList")
   dp <- TCGAlgg();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- geteventList(ptHistory)
   checkEquals(length(events), 4899)
   
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(Absent=120,
                    Background=459,
                    Birth=459,
                    Diagnosis=459,
                    Drug=498,
                    Encounter=897,
                    Pathology=473,
                    Procedure=181,
                    Progression=154,
                    Radiation=281,
                    Status=459,
                    Tests=459))

} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   print("--- testHistoryTable")
   dp <- TCGAlgg();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(459, 329))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), "TCGAlgg")
   checkEquals(as.character(events[1,4]),"01/23/1977")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("546", "11666", "NA"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
testExpression <- function()
{
   print("--- testExpression")

   dir <- system.file(package="TCGAlgg", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mrna.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna"))
   checkTrue(is(mtx.mrna, "matrix"))
   checkEquals(class(mtx.mrna[1,1]), "numeric")

   checkEquals(dim(mtx.mrna), c(527, 20444))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna), c(-5.8948, -0.5543, -0.2037, 0.2765, 20121.9727))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mrna) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mrna))), nrow(mtx.mrna))

} # testExpression

#--------------------------------------------------------------------------------
testMutation <- function()
{
   print("--- testMutation")

   dir <- system.file(package="TCGAlgg", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mut.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mut"))
   checkTrue(is(mtx.mut, "matrix"))
   checkEquals(dim(mtx.mut), c(289, 6154))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
     #regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w"
   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))

     # contents should all be character, now factors
   checkTrue(all(unlist(lapply(mtx.mut, function(row){class(row)}), use.names=FALSE) == "character"))


} # testMutation
#--------------------------------------------------------------------------------
testCopyNumber <- function()
{
   print("--- testCopyNumber")

   dir <- system.file(package="TCGAlgg", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.cn.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.cn"))
   checkTrue(is(mtx.cn, "matrix"))
   checkEquals(dim(mtx.cn), c(513,22184))

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
   print("--- testProteinAbundance")

   dir <- system.file(package="TCGAlgg", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.prot.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.prot"))
   checkTrue(is(mtx.prot, "matrix"))
   checkEquals(class(mtx.prot[1,1]), "numeric")

   checkEquals(dim(mtx.prot), c(260, 189))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.prot), c(-5.49454639, -0.64817849, -0.08121155,  0.56151266,  9.79907304))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
     #regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w"
   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))

} # testExpression
#----------------------------------------------------------------------------------------------------
testMethylation <- function()
{
   print("--- testMethylation")

   dir <- system.file(package="TCGAlgg", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.meth.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.meth"))
   checkTrue(is(mtx.meth, "matrix"))
   checkEquals(class(mtx.meth[1,1]), "numeric")

   checkEquals(dim(mtx.meth), c(530, 16223))

     # a reasonable range of expression log2 ratios
     #checkEquals(fivenum(mtx.meth), c(0.004862255, 0.052114764, 0.397865738, 0.841466552, 0.995080719))
   checkEquals(fivenum(mtx.meth), c(0.00486, 0.05211, 0.39787, 0.84147, 0.99508))
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
     #regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w"
   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))

} # testExpression

#--------------------------------------------------------------------------------
testMatrixAndDataframeAccessors <- function()
{
   print("--- testMatrixAndDataframeAccessors")
   dp <- TCGAlgg();
   checkTrue("mtx.cn" %in% names(matrices(dp)))
   samples <- head(entities(dp, "mtx.cn"), n=3)
   checkEquals(samples, c("TCGA.CS.4938.01", "TCGA.CS.4941.01", "TCGA.CS.4942.01"))
    

} # testMatrixAndDataframeAccessors
#--------------------------------------------------------------------------------
