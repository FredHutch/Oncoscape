library(AnalysisDemo)
library(RUnit)
#------------------------------------------------------------------------------------------------------------------------
runTests <- function()
{
  test_noArgs_constructor()
  test_args_constructor()
  test_setExpression()
  test_.trimMatrix()
  test_score()

} # runTests
#------------------------------------------------------------------------------------------------------------------------
test_noArgs_constructor = function ()
{
  printf("--- test_noArgsconstructor")

    # first, the no-args constructor
  demo <- AnalysisDemo()
  checkEquals(getSampleIDs(demo), list())
  checkEquals(getGeneSet(demo), list())

} # test_constructor
#------------------------------------------------------------------------------------------------------------------------
test_args_constructor <- function()
{
   printf("--- test_args_constructor")

      # this package has geneset data and "unified" tcga gbm expression -- unified as described in
      #    https://tcga-data.nci.nih.gov/docs/publications/unified_expression/

   data("msigdb")
   checkTrue(length(genesets) > 10000)

     # two genesets of interest in this demo, of 11 and 9 genes respectively
     # we should be able to see some expression signal for these genesets
     # when we get sampleIDs which are short survival and long
   
   gsoi.1 <- "YAMANAKA_GLIOBLASTOMA_SURVIVAL_UP"
   gsoi.2 <- "YAMANAKA_GLIOBLASTOMA_SURVIVAL_DN"
   
     # make sure we truly have genesets corresponding to these names
   checkTrue(all(c(gsoi.1, gsoi.2) %in% names (genesets)))

     # load the expression data, curated by TCGA, a "unified" set, from 3 labs, 3 technolgies
   data("tbl.mrnaUnified.TCGA.GBM")
   checkEquals(dim(tbl.mrna), c(315, 11864))

     # get the two genesets
   genesets.up <- genesets[gsoi.1]
   genesets.dn <- genesets[gsoi.2]

      # tcga gbm samples with survival < 0.05 years post diagnsosis
   shortSurvivors <- list("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                          "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097")
      # tcga gbm samples with survival >6 years post diagnsosiss
   longSurvivors <- list("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0080", "TCGA.02.0114",
                         "TCGA.06.6693", "TCGA.08.0344", "TCGA.12.0656", "TCGA.12.0818", "TCGA.12.1088")

   demo2 <- AnalysisDemo(sampleIDs=longSurvivors, geneSet=genesets.up,
                         sampleDescription="TCGA GBM long survivors",
                         geneSetDescription="msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_UP")
                         

   checkEquals(getSampleIDs(demo2), longSurvivors)
   checkEquals(getGeneSet(demo2), genesets.up)

} # test_args_constructor
#------------------------------------------------------------------------------------------------------------------------
test_setExpression <- function()
{
   printf("--- test_setExpression")

   data("tbl.mrnaUnified.TCGA.GBM")
   data("msigdb")

   indices <- grep("YAMANAKA", names(genesets))  # 7551 7552
   genesets.yamanaka <- genesets[indices]
   shortSurvivors <- list("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                          "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097")
   demo3 <- AnalysisDemo(sampleIDs=shortSurvivors, geneSet=genesets.yamanaka[1],
                         sampleDescription="TCGA GBM long survivors",
                         geneSetDescription="msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_UP")

   demo3 <- setExpressionData(demo3, tbl.mrna)
   mtx <- getExpressionData(demo3)
   checkEquals(dim(mtx), c(315, 11864))
    
} # test_setExpression
#------------------------------------------------------------------------------------------------------------------------
test_setExpression <- function()
{
   printf("--- test_setExpression")

   data("tbl.mrnaUnified.TCGA.GBM")
   data("msigdb")

   indices <- grep("YAMANAKA", names(genesets))  # 7551 7552
   genesets.yamanaka <- genesets[indices]
   shortSurvivors <- list("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                          "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097")
   demo3 <- AnalysisDemo(sampleIDs=shortSurvivors, geneSet=genesets.yamanaka[2],
                         sampleDescription="TCGA GBM long survivors",
                         geneSetDescription="msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_DN")
   demo3 <- setExpressionData(demo3, tbl.mrna)
   mtx <- getExpressionData(demo3)
   checkEquals(dim(mtx), c(315, 11864))
    
} # test_setExpression
#------------------------------------------------------------------------------------------------------------------------
# test the internal function (note leading ".") which subsets the supplied expression matrix by the acutal existing
# gene names and sampleIDs

test_.trimMatrix <- function()
{
   printf("--- test_.trimMatrix")
   data("tbl.mrnaUnified.TCGA.GBM")
   data("msigdb")

   indices <- grep("YAMANAKA", names(genesets))  # 7551 7552
   genesets.yamanaka <- genesets[indices]
   shortSurvivors <- list("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                          "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097")
   demo3 <- AnalysisDemo(sampleIDs=shortSurvivors, geneSet=genesets.yamanaka[2],
                         sampleDescription="TCGA GBM long survivors",
                         geneSetDescription="msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_DN")
   demo3 <- setExpressionData(demo3, tbl.mrna)
   yamanaka.up.genes <- as.character(genesets[[7551]])

      # note that .trimMatrix is an unexported function, taking only simple arguments (matrix, 2 character vectors)
   mtx.trimmed <- AnalysisDemo:::.trimMatrix(tbl.mrna, as.character(shortSurvivors), yamanaka.up.genes)
   invisible(mtx.trimmed)   
   
} # test_.trimMatrix
#------------------------------------------------------------------------------------------------------------------------
# the simplest test (the least nuanced test) is a t-test: for each selected sample, does the expression of the
# nominated genes come from a different distribution than the expression of a similarly-sized group of genee
# randomly drawn from all the other genes?  no monte carlo test used here...
test_score <- function()
{
   printf("--- test_score")

   data("msigdb")
   checkTrue(length(genesets) > 10000)

     # two genesets of interest in this demo, of 11 and 9 genes respectively
     # we should be able to see some expression signal for these genesets
     # when we get sampleIDs which are short survival and long
   
   gsoi <- list("YAMANAKA_GLIOBLASTOMA_SURVIVAL_UP", "YAMANAKA_GLIOBLASTOMA_SURVIVAL_DN")
   data("tbl.mrnaUnified.TCGA.GBM")
   checkEquals(dim(tbl.mrna), c(315, 11864))
   indices <- grep("YAMANAKA", names(genesets))  # 7551 7552
   checkEquals(length(indices), 2)
   genesets.yamanaka <- genesets[indices]

      # tcga gbm samples with survival < 0.05 years post diagnsosis
   shortSurvivors <- list("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                          "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097")

      # tcga gbm samples with survival >6 years post diagnsosiss
   longSurvivors <- list("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0080", "TCGA.02.0114",
                         "TCGA.06.6693", "TCGA.08.0344", "TCGA.12.0656", "TCGA.12.0818", "TCGA.12.1088")

   demo <- AnalysisDemo(sampleIDs=longSurvivors, geneSet=genesets.yamanaka[1],
                        sampleDescription="TCGA GBM long survivors",
                        geneSetDescription="msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_UP")
   
   demo <- setExpressionData(demo, tbl.mrna)

     # the test is pretty weak, even silly:
     # run t.test on each of 8 samples, comparing 8 yamanaka survival up genes against
     # 8 chosen at random, with t.test reproducability achieved by set.seed
     # a monte carlo test, at least, is needed to make this interesting

   set.seed(123)
   scores <- score(demo)
   checkEquals(names(scores), c("sample.title", "geneSet.title", "actual.samples.used", "actual.genes.used",
                                "unmatched.samples", "unmatched.genes", "pvals"))

   checkEquals(scores$sample.title, "TCGA GBM long survivors")
   checkEquals(scores$geneSet.title, "msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_UP")
   checkEquals(sort(c(scores$actual.samples.used, scores$unmatched.samples)), sort(unlist(longSurvivors)))
   checkEquals(sort(c(scores$actual.genes.used, scores$unmatched.genes)), sort(unlist(genesets.yamanaka[1], use.names=FALSE)))
   checkEquals(names(which(scores$pvals < 0.05)), c("TCGA.02.0014", "TCGA.02.0080", "TCGA.02.0114"))

     # now test the yamanaka "DN" genes
   demo2 <- AnalysisDemo(sampleIDs=longSurvivors, geneSet=genesets.yamanaka[2],
                         sampleDescription="TCGA GBM long survivors",
                         geneSetDescription="msgidb:YAMANAKA_GLIOBLASTOMA_SURVIVAL_DOWN")
   
   demo2 <- setExpressionData(demo2, tbl.mrna)
   set.seed(123)
   scores.2 <- score(demo2)
   checkEquals(names(which(scores.2$pvals < 0.05)), character(0))   

} # test_score
#------------------------------------------------------------------------------------------------------------------------
