library(RUnit)
library(TCGAlung)
library(org.Hs.eg.db)
Sys.setlocale("LC_ALL", "C")
  ## to prevent issues with different sort calls (3/3/15)
#--------------------------------------------------------------------------------
runTests <- function()
{
    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a TCGAlung data package

  testConstructor();
  testManifest()
  testCopyNumber()
  testHistoryList()
  testHistoryTable()
  testExpression()
  testMutation() 
  testMethylation() 
  testProteinAbundance() 

    # the following tests address the -use- of this class by client code

  testMatrixAndDataframeAccessors()
  
} # runTests
#--------------------------------------------------------------------------------
testManifest <- function()
{
   print("--- testManifest")
   dir <- system.file(package="TCGAlung", "extdata")
   checkTrue(file.exists(dir))
   
   file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkEquals(dim(tbl), c(9, 11))
   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   checkEquals(tbl$category, c("copy number", "history", "mutations", "protein abundance","methylation","methylation","mRNA expression","mRNA expression","mRNA expression"))
   checkEquals(rownames(tbl), c("mtx.cn.RData", "history.RData", "mtx.mut.RData", "mtx.prot.RData", "mtx.methHM450.RData","mtx.methHM27.RData", "mtx.mrna_Agi.RData", "mtx.mrna_Seq.RData", "mtx.mrna_U133.RData"))
   checkEquals(sort(tbl$class), c("list", "matrix", "matrix", "matrix", "matrix", "matrix", "matrix", "matrix", "matrix"))

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
      #provenance <- tbl$provenance[i];
      #checkEquals(provenance, "tcga luad and lusc")
      } # for i
    checkEquals(tbl$provenance,c("tcga luad and lusc",
                                  "tcga luad and lusc",
                                  "tcga luad and lusc",
                                  "tcga luad and lusc",
                                  "tcga luad and lusc; one probe per gene- most anti-correlated with expression",
                                  "tcga luad and lusc; one probe per gene- most anti-correlated with expression",
                                  "tcga luad and lusc",
                                  "tcga luad and lusc",
                                  "tcga lusc"))

   TRUE
   
} # testManifest
#----------------------------------------------------------------------------------------------------
testExpression <- function()
{
  print("--- testExpression")

   dir <- system.file(package="TCGAlung", "extdata")
   checkTrue(file.exists(dir))
   #-------mtx.mrna_Agi.RData-------
   file <- file.path(dir, "mtx.mrna_Agi.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mrna"))
   checkTrue(is(mtx.mrna, "matrix"))
   checkEquals(class(mtx.mrna[1,1]), "numeric")

   checkEquals(dim(mtx.mrna), c(186, 17212))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.mrna), c(-28.7792, -0.7257,-0.0585,0.6586,47.0682))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
     #checkTrue(all(colnames(mtx.mrna) %in% keys(org.Hs.egSYMBOL2EG))) #354 are not

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mrna))), nrow(mtx.mrna))
   
    #-------mtx.mrna_Seq.RData-------
    file <- file.path(dir, "mtx.mrna_Seq.RData")
    checkTrue(file.exists(file))
    
    load(file)
    checkTrue(exists("mtx.mrna"))
    checkTrue(is(mtx.mrna, "matrix"))
    checkEquals(class(mtx.mrna[1,1]), "numeric")
    
    checkEquals(dim(mtx.mrna), c(991, 20444))
    
    # a reasonable range of expression log2 ratios
    checkEquals(fivenum(mtx.mrna), c(-4.8681 , -0.5608 , -0.2107, 0.2755,38659.0448))
    
    # all colnames should be recognzied gene symbols.  no isoform suffixes yet
    #checkTrue(all(colnames(mtx.mrna) %in% keys(org.Hs.egSYMBOL2EG))) #535 are not
    
    # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
    regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
    checkEquals(length(grep(regex, rownames(mtx.mrna))), nrow(mtx.mrna))
    #-------mtx.mrna_U133.RData-------
    file <- file.path(dir, "mtx.mrna_U133.RData")
    checkTrue(file.exists(file))
    
    load(file)
    checkTrue(exists("mtx.mrna"))
    checkTrue(is(mtx.mrna, "matrix"))
    checkEquals(class(mtx.mrna[1,1]), "numeric")
    
    checkEquals(dim(mtx.mrna), c(133, 11878))
    
    # a reasonable range of expression log2 ratios
    checkEquals(fivenum(mtx.mrna), c( -9.9347,-0.6941 ,-0.0825 , 0.6419 ,61.9539))
    # all colnames should be recognzied gene symbols.  no isoform suffixes yet
    #checkTrue(all(colnames(mtx.mrna) %in% keys(org.Hs.egSYMBOL2EG))) #143 are not
    
    # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
    regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
    checkEquals(length(grep(regex, rownames(mtx.mrna))), nrow(mtx.mrna))

} # testExpression
#--------------------------------------------------------------------------------
testMutation <- function()
{
   print("--- testMutation")

   dir <- system.file(package="TCGAlung", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.mut.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.mut"))
   checkTrue(is(mtx.mut, "matrix"))
   checkEquals(dim(mtx.mut), c(407, 16655))

     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.mut) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.mut))), nrow(mtx.mut))

     # contents should all be character, now factors
   checkTrue(all(unlist(lapply(mtx.mut, class), use.names=FALSE) == "character"))


} # testMutation
#--------------------------------------------------------------------------------
testCopyNumber <- function()
{
   print("--- testCopyNumber")

   dir <- system.file(package="TCGAlung", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.cn.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.cn"))
   checkTrue(is(mtx.cn, "matrix"))
   checkEquals(dim(mtx.cn), c(1016, 22184))

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

   dir <- system.file(package="TCGAlung", "extdata")
   checkTrue(file.exists(dir))
   file <- file.path(dir, "mtx.prot.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.prot"))
   checkTrue(is(mtx.prot, "matrix"))
   checkEquals(class(mtx.prot[1,1]), "numeric")

   checkEquals(dim(mtx.prot), c(376, 228))

     # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.prot), c(-5.39682915, -0.63367623, -0.07445666,  0.55577806, 9.95972284))
   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.prot) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.prot))), nrow(mtx.prot))

} # testProteinAbundance
#----------------------------------------------------------------------------------------------------
testMethylation <- function()
{
   print("--- testMethylation")

   dir <- system.file(package="TCGAlung", "extdata")
   checkTrue(file.exists(dir))
   #-------mtx.methHM450.RData----------
   file <- file.path(dir, "mtx.methHM450.RData")
   checkTrue(file.exists(file))

   load(file)
   checkTrue(exists("mtx.meth"))
   checkTrue(is(mtx.meth, "matrix"))
   checkEquals(class(mtx.meth[1,1]), "numeric")

   checkEquals(dim(mtx.meth), c(810, 16749))

     # a reasonable range of expression log2 ratios
     checkEquals(fivenum(mtx.meth), c(0.004365384, 0.054082593, 0.336544430, 0.718516663, 0.995690633))

   
     # all colnames should be recognzied gene symbols.  no isoform suffixes yet
#   checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))

     # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))
   #-------mtx.methHM27.RData----------
   file <- file.path(dir, "mtx.methHM27.RData")
   checkTrue(file.exists(file))
   
   load(file)
   checkTrue(exists("mtx.meth"))
   checkTrue(is(mtx.meth, "matrix"))
   checkEquals(class(mtx.meth[1,1]), "numeric")
   
   checkEquals(dim(mtx.meth), c(259, 2552))
   
   # a reasonable range of expression log2 ratios
   checkEquals(fivenum(mtx.meth), c(0.004523024,0.043203067,0.231726016,0.643797684,0.994422364))
   
   
   # all colnames should be recognzied gene symbols.  no isoform suffixes yet
   #   checkTrue(all(colnames(mtx.meth) %in% keys(org.Hs.egSYMBOL2EG)))
   
   # all rownames should follow "TCGA.02.0014" format.  no multiply-sampled suffixes yet
   regex <- "^TCGA\\.\\w\\w\\.\\w\\w\\w\\w\\.[0-9][0-9]$"
   checkEquals(length(grep(regex, rownames(mtx.meth))), nrow(mtx.meth))
   

} # testExpression
#--------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")

   dp <- TCGAlung();
   checkEquals(dim(manifest(dp)), c(9, 11))
   checkEquals(length(matrices(dp)), 8)
   checkEquals(names(matrices(dp)), c("mtx.cn", "mtx.mut", "mtx.prot", "mtx.meth","mtx.meth","mtx.mrna","mtx.mrna","mtx.mrna"))
   checkEquals(eventCount(history(dp)), 10737)
   
} # testConstructor
#--------------------------------------------------------------------------------
testMatrixAndDataframeAccessors <- function()
{
   print("--- testMatrixAndDataframeAccessors")
   dp <- TCGAlung();
   checkTrue("mtx.cn" %in% names(matrices(dp)))
   samples <- head(entities(dp, "mtx.cn"), n=3)
   checkEquals(samples, c("TCGA.05.4244.01", "TCGA.05.4249.01", "TCGA.05.4250.01"))
    

} # testMatrixAndDataframeAccessors
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   print("--- testHistoryList")
   dp <- TCGAlung();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getList(ptHistory)
   checkEquals(length(events), 10737)
    
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(`Absent`=85, `Background` = 996,`Birth`=1015, `Diagnosis`=1015,`Drug`=675,`Encounter`=2863,  `Pathology`=1195,`Procedure`=166, `Progression`=55,  `Radiation`=181, `Status`=1015,`Tests`=1476))
} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   print("--- testHistoryTable")
   dp <- TCGAlung();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(1015, 383))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), c("TCGAluad", "TCGAlusc"))
   checkEquals(as.character(events[1,4]),"07/01/1938")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("0", "25752", "NA"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
