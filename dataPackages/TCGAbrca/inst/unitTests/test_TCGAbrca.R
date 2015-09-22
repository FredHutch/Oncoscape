library(RUnit)
library(TCGAbrca)
library(org.Hs.eg.db)
Sys.setlocale("LC_ALL", "C")
  ## to prevent issues with different sort calls (3/3/15)
#--------------------------------------------------------------------------------
runTests <- function()
{
    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a TCGAbrca data package

  testConstructor();
  testManifest()
  testCopyNumber()
  testHistoryList()
  testHistoryTable()
  testExpression()
  testMutation()#
  testMethylation()#
  testProteinAbundance() 

    # the following tests address the -use- of this class by client code

  testMatrixAndDataframeAccessors()
  
} # runTests
#--------------------------------------------------------------------------------
testManifest <- function()
{
   print("--- testManifest")
   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkEquals(dim(tbl), c(7, 11))
   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   checkEquals(tbl$category, c("copy number", "history",  "mRNA expression", "mutations", "protein abundance","methylation","methylation"))
   checkEquals(rownames(tbl), c("mtx.cn.RData", "history.RData", "mtx.mrna_Agi.RData", "mtx.mut.RData", "mtx.prot.RData", "mtx.methHM450.RData", "mtx.methHM27.RData"))
   checkEquals(sort(tbl$class), c("list", "matrix", "matrix", "matrix", "matrix", "matrix", "matrix"))

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
         checkEqualsNumeric(min(x, na.rm=T), minValue, tolerance=10e-5)
         checkEqualsNumeric(max(x, na.rm=T), maxValue, tolerance=10e-5)
         }
      provenance <- tbl$provenance[i];
      checkEquals(provenance, "tcga")
      } # for i

   TRUE
   
} # testManifest
#----------------------------------------------------------------------------------------------------
testExpression <- function()
{
   print("--- testExpression")
   #---------------mtx.mrna_Seq---------------------
   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mrna_Agi.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna"))
   checkTrue(is(mtx.mrna, "matrix"))
   checkEquals(class(mtx.mrna[1,1]), "numeric")

   checkEquals(dim(mtx.mrna), c(1098, 20444))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna), c( -5.1856 , -0.5329, -0.1741, 0.2570, 38129.8286))
   
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

   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mut.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mut"))
   checkTrue(is(mtx.mut, "matrix"))
   checkEquals(dim(mtx.mut), c(980, 15417))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))

     # contents should all be character, now factors
     checkTrue(all(unlist(lapply(mtx.mut, function(row){class(row)}), use.names=FALSE) == "character"))
    

} # testMutation
#--------------------------------------------------------------------------------
testCopyNumber <- function()
{
   print("--- testCopyNumber")

   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.cn.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.cn"))
   checkTrue(is(mtx.cn, "matrix"))
   checkEquals(dim(mtx.cn), c(515,22184))

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

   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.prot.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.prot"))
   checkTrue(is(mtx.prot, "matrix"))
   checkEquals(class(mtx.prot[1,1]), "numeric")

   checkEquals(dim(mtx.prot),c(409, 142))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.prot), c(-8.26850856,-0.61995981,-0.03916546,0.56419607,11.42508086))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))

} # testExpression
#----------------------------------------------------------------------------------------------------
testMethylation <- function()
{
   print("--- testMethylation")
   #----------mtx.methHM450------------------------
   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.methHM450.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.meth"))
   checkTrue(is(mtx.meth, "matrix"))
   checkEquals(class(mtx.meth[1,1]), "numeric")

   checkEquals(dim(mtx.meth), c(737, 16094))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.meth), c(0.003091941, 0.046411675, 0.342651862, 0.766786129, 0.996213304))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.methHM450) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))
   #----------mtx.methHM27------------------------
   dir <- system.file(package="TCGAbrca", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.methHM27.RData")
   checkTrue(file.exists(file))
   
   load(file)
   checkTrue(exists("mtx.meth"))
   checkTrue(is(mtx.meth, "matrix"))
   checkEquals(class(mtx.meth[1,1]), "numeric")
   
   checkEquals(dim(mtx.meth), c(315, 1659))
   
   # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.meth), c(0.003548976, 0.041815554, 0.244927130, 0.709312130, 0.995963449))
   
   # all colnames should be recognzied gene symbols.  no isoform suffixes yet
   #   checkTrue(all(colnames(mtx.methHM450) %in% keys(org.Hs.egSYMBOL2EG)))
   
   # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"

} # testMethylation
#--------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")

   dp <- TCGAbrca();
   checkEquals(dim(manifest(dp)), c(7, 11))
   checkEquals(length(matrices(dp)), 6)
   checkEquals(names(matrices(dp)), c("mtx.cn","mtx.mrna","mtx.mut", "mtx.prot", "mtx.meth", "mtx.meth"))
   checkEquals(eventCount(history(dp)), 10841)
   
} # testConstructor
#--------------------------------------------------------------------------------
testMatrixAndDataframeAccessors <- function()
{
   print("--- testMatrixAndDataframeAccessors")
   dp <- TCGAbrca();
   checkTrue("mtx.cn" %in% names(matrices(dp)))
   samples <- head(entities(dp, "mtx.cn"), n=3)
   checkEquals(samples, c("TCGA.05.4244.01", "TCGA.05.4249.01", "TCGA.05.4250.01"))
    

} # testMatrixAndDataframeAccessors
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   print("--- testHistoryList")
   dp <- TCGAbrca();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getList(ptHistory)
   checkEquals(length(events), 10841)
    
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(Absent=26,
                    Background=1020,
                    Birth=1088,
                    Diagnosis=1088,
                    Drug=2314,
                    Pathology=1171,
                    Procedure=1100,
                    Progression=69,
                    Radiation=584,
                    Status=1088,
                    Tests=1293))

} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   print("--- testHistoryTable")
   dp <- TCGAbrca();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(1088, 419))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), "TCGAbrca")
   checkEquals(as.character(events[1,4]),"08/31/1948")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("3767", "20211", "NA"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
