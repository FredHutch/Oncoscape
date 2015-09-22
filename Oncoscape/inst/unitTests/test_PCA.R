# test_survival.R
#----------------------------------------------------------------------------------------------------
library(RUnit)
library(OncoDev14)
library(TCGAgbm)
library(DEMOdz)
#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
if(!exists("mtx.mrna")){
   ds <- TCGAgbm()
   checkTrue("mtx.mrna" %in% names(matrices(ds)))
   mtx.mrna <- matrices(ds)$mtx.mrna
   tbl.pt <- getPatientTable(ds)
   } # if
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
   test_dataReady();
   test_smallExpressionSet(); # DEMOdz has only 20 patients, 64 genes
   test_largeExpressionSet();

} # runTests
#----------------------------------------------------------------------------------------------------
test_dataReady <- function()
{
   print("--- test_dataReady")
   checkEquals(dim(mtx.mrna), c(154, 20457))

} # test_dataReady
#----------------------------------------------------------------------------------------------------
test_smallExpressionSet <- function()
{
   print("--- test_smallExpressionSet");
   ds <- DEMOdz()
   mtx <- matrices(ds)$mtx.mrna
   checkEquals(dim(mtx), c(20,64))
   checkEqualsNumeric(fivenum(mtx),
                      c(-4.09886792, -0.74699972, -0.01280164, 0.71880694, 5.87099417),
                      tolerance=1e-4)

   x <- OncoDev14:::pcaAnalysis(mtx)
   checkEquals(sort(names(x)), c("importance", "loadings", "method", "scores"))

   checkEquals(dim(x$loadings), c(64, 21))
   checkEquals(colnames(x$loadings), c(paste("PC", 1:20, sep=""), "id"))
   checkEquals(sort(x$loadings$id), sort(colnames(mtx)))

     # note that these tcga ids have no suffix
   checkEquals(x$scores$id[1:5], c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0033", "TCGA.02.0037"));


   checkEquals(dim(x$importance), c(3, 20))
   checkEquals(rownames(x$importance),
               c("Standard deviation", "Proportion of Variance","Cumulative Proportion"))
   checkEquals(dim(x$scores), c(20,21))
   
} # test_smallExpressionSet
#----------------------------------------------------------------------------------------------------
test_largeExpressionSet <- function()
{
   print("--- test_largeExpressionSet");
   ds <- TCGAgbm()
   mtx <- matrices(ds)$mtx.mrna
   checkEquals(head(rownames(mtx)),
               c("TCGA.02.0047.01", "TCGA.02.0055.01", "TCGA.02.2483.01", "TCGA.02.2485.01",
                 "TCGA.02.2486.01", "TCGA.06.0125.01"))
   checkEquals(dim(mtx), c(154, 20457))

   x <- OncoDev14:::pcaAnalysis(mtx)
   checkEquals(sort(names(x)), c("importance", "loadings", "method", "scores"))

   checkEquals(dim(x$loadings), c(19719, 155))
     # have the suffixes been chopped off?
   checkEquals(x$scores$id[1:5], c("TCGA.02.0047.01", "TCGA.02.0055.01", "TCGA.02.2483.01",
                                   "TCGA.02.2485.01", "TCGA.02.2486.01"))

   checkEquals(rownames(x$importance), c("Standard deviation", "Proportion of Variance",
                                         "Cumulative Proportion"))

} # test_largeExpressionSet
#----------------------------------------------------------------------------------------------------
