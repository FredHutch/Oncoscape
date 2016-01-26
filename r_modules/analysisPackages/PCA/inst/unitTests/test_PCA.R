library(PCA)
library(RUnit)
library(DEMOdz)
library(TCGAgbm)
Sys.setlocale("LC_ALL", "C")

if(!exists("marker.genes.545")){
    print(load(system.file(package="TCGAgbm", "extdata", "genesets.RData")))
    marker.genes.545 <- genesets$marker.genes.545
    tcga.GBM.classifiers <- genesets$tcga.GBM.classifiers
    }
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test_constructor()
  test_calculate()
  test_calculate_patientSubset()
  test_calculate_geneSubset()
  
} # runTests
#----------------------------------------------------------------------------------------------------
test_constructor = function()
{
   printf("--- test_constructor")
   demoDz <- DEMOdz()
   matrix.name <- "mtx.mrna.ueArray"
   pca <- PCA(demoDz, matrix.name)

   checkEquals(getDataPackage(pca), demoDz)
   checkTrue(grepl("PCA package", pcaDataSummary(pca)))
   checkEquals(getDataMatrixName(pca), matrix.name)

} # test_constructor
#----------------------------------------------------------------------------------------------------
test_calculate <- function()
{
   printf("--- test_calculate")
   dz <- DEMOdz()
   mtx.name <- "mtx.mrna.ueArray"
   pca <- PCA(dz, mtx.name)
   x <- calculate(pca)

   checkEquals(sort(names(x)), c("importance", "loadings", "method", "sampleIDs", "scores"))
   checkEquals(dim(x$scores), c(20, 21))
   checkEquals(length(grep("PC", colnames(x$scores))), 20)  # 20 components 1 id column
      # the components should average out to very near zero
   checkEqualsNumeric(mean(as.matrix(x$scores[, 1:20])), 0, 1e-10)

   mtx <- matrices(dz)[[mtx.name]]
      # should be loadings for each gene
   checkEquals(ncol(mtx), nrow(x$loadings))
   checkEquals(nrow(x$scores), nrow(mtx))
   checkEquals(x$sampleIDs, rownames(mtx))

      # x$importance has "variance explained" information
   checkEqualsNumeric(x$importance["Proportion of Variance", "PC1"], 0.321830, tol=1e-5)
   checkEqualsNumeric(x$importance["Proportion of Variance", "PC2"], 0.16252, tol=1e-5)

} # test_calculate
#----------------------------------------------------------------------------------------------------
test_calculate_patientSubset <- function()
{
   printf("--- testCalculate_pateintSubset")
   dz <- DEMOdz()
   mtx.name <- "mtx.mrna.ueArray"
   pca <- PCA(dz, mtx.name)

   mtx <- matrices(dz)[[mtx.name]]
   poi <- rownames(mtx)[1:10]
   x <- calculate(pca, samples=poi)

   checkEquals(dim(x$scores), c(10, 11))
   checkEquals(dim(x$importance), c(3, 10))
   checkEquals(dim(x$loadings), c(64, 11))

     # one set of components for each sample; genes are all collapsed into the components
   checkEquals(nrow(x$scores), length(poi))
   checkEquals(x$sampleIDs, poi)


   checkEqualsNumeric(x$importance["Proportion of Variance", "PC1"], 0.38648, tol=1e-5)
   checkEqualsNumeric(x$importance["Proportion of Variance", "PC2"], 0.16616, tol=1e-5)

} # test_calculate_patientSubset
#----------------------------------------------------------------------------------------------------
test_calculate_geneSubset <- function()
{
   printf("--- testCalculate_geneSubset")
   dz <- DEMOdz()
   mtx.name <- "mtx.mrna.ueArray"
   pca <- PCA(dz, mtx.name)

   mtx <- matrices(dz)[[mtx.name]]
   goi <- colnames(mtx)[1:10]
   x <- calculate(pca, genes=goi)

   checkEquals(dim(x$scores), c(20, 11))
   checkEquals(dim(x$importance), c(3, 10))
   checkEquals(dim(x$loadings), c(10, 11))

   checkEquals(nrow(mtx), nrow(x$scores))
   checkEquals(x$sampleIDs, rownames(mtx))

   checkEqualsNumeric(x$importance["Proportion of Variance", "PC1"], 0.32964, tol=1e-5)
   checkEqualsNumeric(x$importance["Proportion of Variance", "PC2"], 0.24605, tol=1e-5)

} # test_calculate_geneSubset
#----------------------------------------------------------------------------------------------------
test_calculateWithUnversionedSampleIDs <- function()
{
   print("--- test_calculateWithUnversionedSampleIDs")
   versionless.ids <- c("TCGA.12.1088", "TCGA.DU.5870", "TCGA.DU.6392", "TCGA.DU.6404", "TCGA.DU.7008",
                        "TCGA.DU.7009", "TCGA.E1.5311", "TCGA.E1.5322", "TCGA.HT.7483", "TCGA.S9.A7R1")
   require("TCGAbrain")
   dz <- TCGAbrain()

   mtx.name <- "mtx.mrna.bc";
   pca <- PCA(dz, mtx.name)
   mtx <- matrices(dz)[[mtx.name]]
   x <- calculate(pca, samples=versionless.ids)
   

} # test_calculateWithUnversionedSampleIDs
#----------------------------------------------------------------------------------------------------

if(!interactive())
    runTests()
