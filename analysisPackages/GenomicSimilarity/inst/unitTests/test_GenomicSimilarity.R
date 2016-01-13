library(RUnit)
library(GenomicSimilarity)
library(DEMOdz)
library(TCGAgbm)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test_constructor();
  test_.assembleBaseMatrix()
  test_calculate.DEMOdz.mut.cn()

} # runTests
#----------------------------------------------------------------------------------------------------
test_constructor <- function()
{
   print("--- test_constructor")
   dz <- DEMOdz();
   mtxNames <- c("mtx.mut", "mtx.cn")
   genSim <- GenomicSimilarity(dz, matrixNames=mtxNames)
   checkEquals(getMatrixNames(genSim), mtxNames)
   
} # test_constructor
#----------------------------------------------------------------------------------------------------
test_.assembleBaseMatrix <- function()
{
   print("--- test_.assembleBaseMatrix")
   dz <- DEMOdz();
   mtxNames <- c("mtx.mut", "mtx.cn")
   genSim <- GenomicSimilarity(dz, matrixNames=mtxNames)
   mtx.base <- GenomicSimilarity:::.assembleBaseMatrix(genSim)
   checkEquals(dim(mtx.base), c(20, 128))

     # judicious use of cross-tab function 'table' allows easy
     # checking of mtx.base
     #    table(matrices(dz)$mtx.cn, useNA="ifany")
     #    table(matrices(dz)$mtx.mut, useNA="ifany")
     #  7 mutations and 1273 NAs, rendered as 1 and 0 respectively
     #  should produce, for  mtx.base, these frequencies
     #    -2   -1    0    1    2 
     #     9  120 2199  217   15 

   checkEquals(sum(abs(mtx.base)), 385)
      # only 7 mutations, these will each will have a value of 1 in mtx.base
      # all wild-type genes will have a value of 0
   checkEquals(sum(table(matrices(dz)$mtx.mut)), 7)

   tbl <- as.data.frame(table(mtx.base), stringsAsFactors=FALSE)
   checkEquals(tbl$mtx.base, as.character(c(-2, -1, 0, 1, 2)))
   checkEquals(tbl$Freq, c(9, 120, 2199, 217, 15))
   
} # test_.assembleBaseMatrix
#----------------------------------------------------------------------------------------------------
test_calculate.DEMOdz.mut.cn <- function()
{
   print("--- test_calculate.DEMOdz.mut.cn")
   dz <- DEMOdz();
   mtxNames <- c("mtx.mut", "mtx.cn")
   genSim <- GenomicSimilarity(dz, matrixNames=mtxNames)
   calculate(genSim)
   tbl <- getSimilarityTable(genSim)
   checkEquals(dim(tbl), c(20, 2))

   checkTrue(all(rownames(tbl) %in% rownames(getPatientTable(dz))))

   checkEquals(colnames(tbl), c("x", "y"))
       # a quick sanity check: find the most and least similar samples
       #
   tbl.dist <- as.matrix(dist(tbl))
   minVal <- min(tbl.dist[tbl.dist != 0])   # [1] 0.1635948
   maxVal <- max(tbl.dist[tbl.dist != 0])   # [1] 8.32835
      # symmetric matrix, get just the first minVal pair
   index.min <- which(tbl.dist == minVal)[1]
   min.pair.1 <- rownames(tbl.dist)[index.min %% nrow(tbl.dist)]
   min.pair.2 <- rownames(tbl.dist)[index.min %/% (nrow(tbl.dist)-1)]

   index.max <- which(tbl.dist == maxVal)[1]
   max.pair.1 <- rownames(tbl.dist)[index.max %% nrow(tbl.dist)]
   max.pair.2 <- rownames(tbl.dist)[index.max %/% (nrow(tbl.dist)-1)]

   mtx.base <- GenomicSimilarity:::.assembleBaseMatrix(genSim)
   tbl.min <- as.data.frame(t(mtx.base[c(min.pair.1, min.pair.2),]))
   matches.in.min <- length(which(tbl.min[,1] == tbl.min[,2])) # 103
   
   tbl.max <- as.data.frame(t(mtx.base[c(max.pair.1, max.pair.2),]))
   matches.in.max <- length(which(tbl.max[,1] == tbl.max[,2])) # 73

   checkTrue(matches.in.max < matches.in.min)
    
} # test_calculate.DEMOdz.mut.cn
#----------------------------------------------------------------------------------------------------
if(!interactive()){
  runTests()
  quit("no")
  }
