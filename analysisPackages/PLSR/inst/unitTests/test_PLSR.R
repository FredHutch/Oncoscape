library(PLSR)
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
  test_summarizePatientNumericFactors()
  test_summarizePatientNumericFactors_TCGAgbm_poorPatientOverlap()
  test_summarizePatientNumericFactors_DEMOdz()
  test_createClassificationMatrix()
  test_createClassificationMatrix.1factor()
  test_createClassificationMatrix.2factors()
  test_createBigClassificationMatrix()
  test_calculateTiny.ageDxDemo()
  #test_calculateTiny.ageDxAndSurvival.demo()
  test_calculateSmall.ageDxOnly()
  test_calculateSmall.survivalOnly()
  test_calculateSmall()
  test_calculateBig()
  test_changeDataSetsAndCalculateSmall()

} # runTests
#----------------------------------------------------------------------------------------------------
test_constructor = function()
{
   printf("--- test_constructor")
   demoDz <- DEMOdz()
   mrna.datasets <- sort(grep("mtx.mrna", manifest(demoDz)$variable, value=TRUE))
   mtx.mrna.ueArray <- matrices(demoDz)$mtx.mrna.ueArray
   mtx.mrna.bc <- matrices(demoDz)$mtx.mrna.bc
   
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")    # "mtx.mrna.ueArray" "mtx.mrna.bc"

   checkEquals(getDataPackage(plsr), demoDz)
   checkEquals(getDataMatrixName(plsr), "mtx.mrna.ueArray")
   checkEquals(plsrDataSummary(plsr),
                "PLSR package, matrices: mtx.mrna.ueArray,mtx.mrna.bc,mtx.mut,mtx.cn,mtx.prot,mtx.meth")

} # test_constructor
#----------------------------------------------------------------------------------------------------
# clients of this class will want to now how crucial phenotypic variables (AgeDx, Survival, etc.) vary.
# there may be more patient clinical data than patient expression (or other molecular measurement) data.
# it is only the ranges of, for instance, patient survival data from patients for whom we have expression
# data that will be interesting, and for which contrasting values (short vs long survival) might be
# correlated with gene expression.  do the interesection of patient groups here, so the user can
# easily discern how those values vary for acutally relevant patients
test_summarizePatientNumericFactors <- function()
{
   printf("--- test_summarizePatientNumericFactors")
   dz <- TCGAgbm()   # use TCGAgbm 
   checkEquals(grep("mtx.mrna", names(matrices(dz)), value=TRUE), c("mtx.mrna", "mtx.mrna.ueArray"))

   plsr <- PLSR(dz, "mtx.mrna")

      # check first for things which should not work
   suppressWarnings({
      checkTrue(is.na(summarizeNumericPatientAttributes(plsr, "bogus")))
      checkTrue(is.na(summarizeNumericPatientAttributes(plsr, "Pathology.method")))
      })
   summary <- summarizeNumericPatientAttributes(plsr, "AgeDx")
   checkEquals(names(summary), "AgeDx")
   ageDx.summary <- summary$AgeDx
   checkEquals(length(ageDx.summary), 5)
   checkEquals(ageDx.summary, c(7827, 19090, 22273, 25665, 32612))

      # compare to the unfiltered range
   unfiltered.age.summary <- fivenum(getPatientTable(dz)$AgeDx)

     # either the min or the max of the unfiltered set must be beyond the
     # filtered set

   checkTrue((ageDx.summary[1] > unfiltered.age.summary[1]) |
              ageDx.summary[5] < unfiltered.age.summary[5])


      # now do two factors which will fail: one unknown, one which is numeric
   factors <- c("bogus", "Pathology.method")
   suppressWarnings({
      summary <- summarizeNumericPatientAttributes(plsr, factors)
      })

   checkEquals(names(summary), factors)
   checkTrue(all(is.na(summary)))

      # now do two legit factors
   factors <- c("AgeDx", "Survival")
   summary <- summarizeNumericPatientAttributes(plsr, factors)
   checkEquals(names(summary), factors)

   checkEquals(summary$AgeDx, c(7827, 19090, 22273, 25665, 32612))
   checkEquals(summary$Survival, c(5, 148, 329, 505, 2681))

     # finally, one legit, one bogus
   factors <- c("AgeDx", "bogus")
   suppressWarnings({
      summary <- summarizeNumericPatientAttributes(plsr, factors)
      })
   checkEquals(names(summary), factors)
   checkEquals(summary$AgeDx, c(7827, 19090, 22273, 25665, 32612))
   checkTrue(is.na(summary$bogus))

} # test_summarizePatientNumericFactors
#----------------------------------------------------------------------------------------------------
test_summarizePatientNumericFactors_TCGAgbm_poorPatientOverlap <- function()
{
   print("--- test_summarizePatientNumericFactors_TCGAgbm_poorPatientOverlap")
   
   dz <- TCGAgbm()   # use TCGAgbm 
   checkEquals(grep("mtx.mrna", names(matrices(dz)), value=TRUE), c("mtx.mrna", "mtx.mrna.ueArray"))

   tbl.pt <- getPatientTable(dz)
   patients <- rownames(tbl.pt)
   checkEquals(length(patients), 592)

   patients.mrna0 <- sub("\\.0[1-9]$", "", rownames(matrices(dz)$mtx.mrna))
   patients.mrna1 <- sub("\\.0[1-9]$", "", rownames(matrices(dz)$mtx.mrna.ueArray))

   missing.in.mrna0 <- setdiff(patients, patients.mrna0)   # 439 missing out of 592 patients in tbl.p
   missing.in.mrna1 <- setdiff(patients, patients.mrna1)   # 288 missing out of 592 patients in tbl.p

   checkEquals(length(patients.mrna0), 154)
   checkEquals(length(patients.mrna1), 323)
   
   plsr <- PLSR(dz, "mtx.mrna")
   patients.overlapping <- intersect(patients, patients.mrna0)
   ageDx.expected <- fivenum(tbl.pt[patients.overlapping, "AgeDx"])
   ageDx.summary <-  summarizeNumericPatientAttributes(plsr, "AgeDx")
   checkEquals(ageDx.expected, ageDx.summary$AgeDx)

   survival.expected <- fivenum(tbl.pt[patients.overlapping, "Survival"])
   survival.summary <-  summarizeNumericPatientAttributes(plsr, "Survival")
   checkEquals(survival.expected, survival.summary$Survival)

     # as a final check do both factors in the same call
   
   summary.both <-  summarizeNumericPatientAttributes(plsr, c("AgeDx", "Survival"))
   checkEquals(ageDx.expected, summary.both$AgeDx)
   checkEquals(survival.expected, summary.both$Survival)


} # test_summarizePatientNumericFactors_TCGAgbm_poorPatientOverlap
#----------------------------------------------------------------------------------------------------
test_summarizePatientNumericFactors_DEMOdz <- function()
{
   print("--- test_summarizePatientNumericFactors_DEMOdz")
   dz <- DEMOdz()
   plsr <- PLSR(dz, "mtx.mrna.bc")
   tbl.pt <- getPatientTable(dz)

      # make sure that all patients in the history table also have expression data
   checkEquals(grep("mtx.mrna", names(matrices(dz)), value=TRUE), c("mtx.mrna.ueArray", "mtx.mrna.bc"))

   patients <- rownames(tbl.pt)
   checkEquals(length(patients), 20)

   patients.mrna0 <- sub("\\.0[1-9]$", "", rownames(matrices(dz)$mtx.mrna.bc))
   patients.mrna1 <- sub("\\.0[1-9]$", "", rownames(matrices(dz)$mtx.mrna.ueArray))
   checkEquals(length(intersect(patients, patients.mrna0)), length(patients))
   checkEquals(length(intersect(patients, patients.mrna1)), length(patients))
   
   ageDx.expected <- fivenum(tbl.pt$AgeDx)
   survival.expected <- fivenum(tbl.pt$Survival)

   ageDx.summary <-  summarizeNumericPatientAttributes(plsr, "AgeDx")
   survival.summary <-  summarizeNumericPatientAttributes(plsr, "Survival")

   checkEquals(ageDx.expected, ageDx.summary$AgeDx)
   checkEquals(survival.expected, survival.summary$Survival)

   summary.both <-  summarizeNumericPatientAttributes(plsr, c("AgeDx", "Survival"))
   checkEquals(ageDx.expected, summary.both$AgeDx)
   checkEquals(survival.expected, summary.both$Survival)

    
} # test_summarizePatientNumericFactors_DEMOdz
#----------------------------------------------------------------------------------------------------
test_createClassificationMatrix <- function()
{
   printf("--- test_createClassificationMatrix")

   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")    # "mtx.mrna.ueArray" "mtx.mrna.bc"

     # tbl.pt <- getPatientTable(demoDz)[, c("AgeDx", "Survival")]
     # fivenum(tbl.pt$AgeDx)  9369.0 15163.5 19153.0 25736.0 31566.0
   loAge <- 15000
   hiAge <- 26000
   loSurv <- 80
   hiSurv <- 2600

   factor1 <- list(name="AgeDx", low=loAge, high=hiAge)

     # fivenum(tbl.pt$Survival)[1]    3.0   82.0  772.0 2620.5 3524.0
   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)
   
   mtx <- createClassificationMatrix(plsr, list(factor1, factor2))

     # 1 row for every patient, 4 columns, lo/hi for each of two factors
   tbl.pt <- getPatientTable(demoDz)
   checkEquals(dim(mtx), c(nrow(tbl.pt), 4))
   checkEquals(colnames(mtx), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(rownames(mtx), rownames(tbl.pt))

     # only zeroes and ones in the matrix
   checkEquals(sort(unique(as.integer(mtx))), c(0, 1))

     # make sure first column, "AgeDx.lo" is accurate: low AgeDx
   low.age.patients <- names(which(mtx[,1] == 1))
   checkTrue(all(tbl.pt[low.age.patients, "AgeDx"] <= loAge))

   not.low.age.patients <- names(which(mtx[,1] == 0))
   checkTrue(all(tbl.pt[not.low.age.patients, "AgeDx"] > loAge))
   
     # make sure second column, "AgeDx.hi" is accurate: high AgeDx
   hi.age.patients <- names(which(mtx[,2] == 1))
   checkTrue(all(tbl.pt[hi.age.patients, "AgeDx"] >= hiAge))

   not.hi.age.patients <- names(which(mtx[,2] == 0))
   checkTrue(all(tbl.pt[not.hi.age.patients, "AgeDx"] < hiAge))
   
   
     # make sure thrird column, "Survival.lo" is accurate: low Survival
   low.survival.patients <- names(which(mtx[,3] == 1))
   checkTrue(all(tbl.pt[low.survival.patients, "Survival"] <= loSurv))

   not.low.survival.patients <- names(which(mtx[,3] == 0))
   checkTrue(all(tbl.pt[not.low.survival.patients, "Survival"] > loSurv))
   
     # make sure second column, "Survival.hi" is accurate: high Survival
   hi.survival.patients <- names(which(mtx[,4] == 1))
   checkTrue(all(tbl.pt[hi.survival.patients, "Survival"] >= hiSurv))

   not.hi.survival.patients <- names(which(mtx[,4] == 0))
   checkTrue(all(tbl.pt[not.hi.survival.patients, "Survival"] < hiSurv))
   

} # test_createClassificationMatrix
#----------------------------------------------------------------------------------------------------
test_createClassificationMatrix.1factor <- function()
{
   printf("--- test_createClassificationMatrix.1factor")

   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")
     # tbl.pt <- getPatientTable(demoDz)[, c("AgeDx", "Survival")]
     # fivenum(tbl.pt$AgeDx)  9369.0 15163.5 19153.0 25736.0 31566.0
   loAge <- 15000
   hiAge <- 26000

   factor <- list(name="AgeDx", low=loAge, high=hiAge)

   mtx <- createClassificationMatrix(plsr, list(factor))

     # 1 row for every patient, 4 columns, lo/hi for each of two factors
   tbl.pt <- getPatientTable(demoDz)
   checkEquals(dim(mtx), c(nrow(tbl.pt), 2))
   checkEquals(colnames(mtx), c("AgeDx.lo", "AgeDx.hi"))
   checkEquals(rownames(mtx), rownames(tbl.pt))

     # only zeroes and ones in the matrix
   checkEquals(sort(unique(as.integer(mtx))), c(0, 1))

     # make sure first column, "AgeDx.lo" is accurate: low AgeDx
   low.age.patients <- names(which(mtx[,1] == 1))
   checkTrue(all(tbl.pt[low.age.patients, "AgeDx"] <= loAge))

   not.low.age.patients <- names(which(mtx[,1] == 0))
   checkTrue(all(tbl.pt[not.low.age.patients, "AgeDx"] > loAge))
   
   hi.age.patients <- names(which(mtx[,2] == 1))
   checkTrue(all(tbl.pt[hi.age.patients, "AgeDx"] >= hiAge))

   not.hi.age.patients <- names(which(mtx[,2] == 0))
   checkTrue(all(tbl.pt[not.hi.age.patients, "AgeDx"] < hiAge))
   
} # test_createClassificationMatrix.1factor
#----------------------------------------------------------------------------------------------------
test_createClassificationMatrix.2factors <- function()
{
   printf("--- test_createClassificationMatrix.2factors")

   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")

     # tbl.pt <- getPatientTable(demoDz)[, c("AgeDx", "Survival")]
     # fivenum(tbl.pt$AgeDx)  9369.0 15163.5 19153.0 25736.0 31566.0
   loAge <- 15000
   hiAge <- 26000
   loSurv <- 80
   hiSurv <- 2600

   loAge <- 16767
   hiAge <- 24168
   loSurv <- 1176
   hiSurv <- 2351


   factor1 <- list(name="AgeDx", low=loAge, high=hiAge)

     # fivenum(tbl.pt$Survival)[1]    3.0   82.0  772.0 2620.5 3524.0
   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)
   
   mtx <- createClassificationMatrix(plsr, list(factor1, factor2))

     # 1 row for every patient, 4 columns, lo/hi for each of two factors
   tbl.pt <- getPatientTable(demoDz)
   checkEquals(dim(mtx), c(nrow(tbl.pt), 4))
   checkEquals(colnames(mtx), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(rownames(mtx), rownames(tbl.pt))

     # only zeroes and ones in the matrix
   checkEquals(sort(unique(as.integer(mtx))), c(0, 1))

     # make sure first column, "AgeDx.lo" is accurate: low AgeDx
   low.age.patients <- names(which(mtx[,1] == 1))
   checkTrue(all(tbl.pt[low.age.patients, "AgeDx"] <= loAge))

   not.low.age.patients <- names(which(mtx[,1] == 0))
   checkTrue(all(tbl.pt[not.low.age.patients, "AgeDx"] > loAge))
   
     # make sure second column, "AgeDx.hi" is accurate: high AgeDx
   hi.age.patients <- names(which(mtx[,2] == 1))
   checkTrue(all(tbl.pt[hi.age.patients, "AgeDx"] >= hiAge))

   not.hi.age.patients <- names(which(mtx[,2] == 0))
   checkTrue(all(tbl.pt[not.hi.age.patients, "AgeDx"] < hiAge))
   
   
     # make sure thrird column, "Survival.lo" is accurate: low Survival
   low.survival.patients <- names(which(mtx[,3] == 1))
   checkTrue(all(tbl.pt[low.survival.patients, "Survival"] <= loSurv))

   not.low.survival.patients <- names(which(mtx[,3] == 0))
   checkTrue(all(tbl.pt[not.low.survival.patients, "Survival"] > loSurv))
   
     # make sure second column, "Survival.hi" is accurate: high Survival
   hi.survival.patients <- names(which(mtx[,4] == 1))
   checkTrue(all(tbl.pt[hi.survival.patients, "Survival"] >= hiSurv))

   not.hi.survival.patients <- names(which(mtx[,4] == 0))
   checkTrue(all(tbl.pt[not.hi.survival.patients, "Survival"] < hiSurv))
   
} # test_createClassificationMatrix.2factors
#----------------------------------------------------------------------------------------------------
# using TCGAgbm, we have 592 patients (in contrast to DEMOdz's 20)
test_createBigClassificationMatrix <- function()
{
   printf("--- test_createBigClassificationMatrix")

   dz <- TCGAgbm()
   plsr <- PLSR(dz, "mtx.mrna")

     # tbl.pt <- getPatientTable(dz)[, c("AgeDx", "Survival")]
     # fivenum(tbl.pt$AgeDx)     # 9369.0 15163.5 19153.0 25736.0 31566.0
     # fivenum(tbl.pt$Survival)  #    3.0   162.0   348.5   590.0  3881.0

   loAge <- 12000
   hiAge <- 28000
   loSurv <- 20
   hiSurv <- 3000

   factor1 <- list(name="AgeDx", low=loAge, high=hiAge)

     # fivenum(tbl.pt$Survival)[1]    3.0   82.0  772.0 2620.5 3524.0
   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)
   
   mtx <- createClassificationMatrix(plsr, list(factor1, factor2))

     # 1 row for every patient, 4 columns, lo/hi for each of two factors
   tbl.pt <- getPatientTable(dz)
   checkEquals(dim(mtx), c(nrow(tbl.pt), 4))
   checkEquals(colnames(mtx), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(rownames(mtx), rownames(tbl.pt))

     # only zeroes and ones in the matrix
   checkEquals(sort(unique(as.integer(mtx))), c(0, 1))

     # make sure first column, "AgeDx.lo" is accurate: low AgeDx
   low.age.patients <- names(which(mtx[,1] == 1))
   checkTrue(all(tbl.pt[low.age.patients, "AgeDx"] <= loAge))

   not.low.age.patients <- names(which(mtx[,1] == 0))
   checkTrue(all(tbl.pt[not.low.age.patients, "AgeDx"] > loAge))
   
     # make sure second column, "AgeDx.hi" is accurate: high AgeDx
   hi.age.patients <- names(which(mtx[,2] == 1))
   checkTrue(all(tbl.pt[hi.age.patients, "AgeDx"] >= hiAge))

   not.hi.age.patients <- names(which(mtx[,2] == 0))
   checkTrue(all(tbl.pt[not.hi.age.patients, "AgeDx"] < hiAge))
   
   
     # make sure thrird column, "Survival.lo" is accurate: low Survival
   low.survival.patients <- names(which(mtx[,3] == 1))
   checkTrue(all(tbl.pt[low.survival.patients, "Survival"] <= loSurv))

   not.low.survival.patients <- names(which(mtx[,3] == 0))
   checkTrue(all(tbl.pt[not.low.survival.patients, "Survival"] > loSurv))
   
     # make sure second column, "Survival.hi" is accurate: high Survival
   hi.survival.patients <- names(which(mtx[,4] == 1))
   checkTrue(all(tbl.pt[hi.survival.patients, "Survival"] >= hiSurv))

   not.hi.survival.patients <- names(which(mtx[,4] == 0))
   checkTrue(all(tbl.pt[not.hi.survival.patients, "Survival"] < hiSurv))
   

} # test_createClassificationMatrix
#----------------------------------------------------------------------------------------------------
test_calculateTiny.ageDxDemo <- function()
{
   printf("--- testCalculateTiny.ageDxDemo")
   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")

   mtx.mrna <- matrices(demoDz)$mtx.mrna.ueArray
   tbl.pt <- getPatientTable(demoDz)

      # find genes whose expression is correlated to ageDx
   checkEquals(rownames(mtx.mrna), rownames(tbl.pt))
   tbl.x <- cbind(tbl.pt[, "AgeDx", drop=FALSE], mtx.mrna)

   #for(gene in colnames(tbl.x[2:65])){
     #  printf("%8s: %5.3f", gene, cor(tbl.x[,1], tbl.x[,gene]))
     #  }

     # the above loop identifies a few genes with > 0.5 correlation to age at diagnosis

   genes.cor.gtHalf <- c("EHD2", "EMP3", "PTPN14")

   loAge <- 12000
   hiAge <- 28000

   factor <- list(name="AgeDx", low=loAge,  high=hiAge)

      # bind AgeDx values and the classification matrix to see
      # how sensible it is.   all rows with just zero could be eliminated:
      # apparently plsr does that in its calculation

   mtx.classification <- createClassificationMatrix(plsr, list(factor))
   mtx.classification <- cbind(tbl.pt[, "AgeDx", drop=FALSE], mtx.classification)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor), genes.cor.gtHalf)
      })

   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue, 1.049491, tol=10e-4)

   checkEquals(dim(x$loadings), c(3, 2))  # 3 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(2, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))
   
} # test_calculateTiny.ageDxDemo
#----------------------------------------------------------------------------------------------------
test_calculateTiny.ageDxAndSurvival.demo <- function()
{
   printf("--- testCalculateTiny.ageDxAndSurvival.demo")
   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")

   mtx.mrna <- matrices(demoDz)$mtx.mrna
   tbl.pt <- getPatientTable(demoDz)

   goi <- c("ELF4", "PIK3C2B", "EMP3", "PLAG1")  # some good correlations to both factors

   loAge <- 12000
   hiAge <- 28000
   loSurvival <- 1000
   hiSurvival <- 2500

   factor.age <- list(name="AgeDx", low=loAge,  high=hiAge)
   factor.survival <- list(name="Survival", low=loSurvival,  high=hiSurvival)
   factor.survival.empty <- list(name="Survival", low=0,  high=64000)

      x0 <- calculatePLSR(plsr, list(factor.age, factor.survival), goi.surv)
      x1 <- calculatePLSR(plsr, list(factor.age), goi.surv)
      x2 <- calculatePLSR(plsr, list(factor.survival), goi.surv)
      x3 <- calculatePLSR(plsr, list(factor.survival.empty), goi.surv)   # error!
      x4 <- calculatePLSR(plsr, list(factor.age, factor.survival.empty), goi.surv)  # same as x1

   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue, 1.049491, tol=10e-4)

   checkEquals(dim(x$loadings), c(3, 2))  # 3 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(2, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))
   
} # test_calculateTiny.ageDxAndSurvival.demo
#----------------------------------------------------------------------------------------------------
test_calculateSmall.ageDxOnly <- function()
{
   printf("--- test_CalculateSmall.ageDxOnly")
   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")
   
   loAge <- 12000
   hiAge <- 28000

   factor <- list(name="AgeDx", low=loAge,  high=hiAge)

   genes.to.use <- colnames(matrices(demoDz)$mtx.mrna.ueArray)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor), genes.to.use)
      })
   
   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue, 0.3464478, tol=10e-4)
   
   checkEquals(dim(x$loadings), c(64, 2))  # 64 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(2, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))
   
} # test_calculateSmall.ageDxOnly
#----------------------------------------------------------------------------------------------------
test_calculateSmall.survivalOnly <- function()
{
   printf("--- testCalculateSmall.survivalOnly")
   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")
   summarizeNumericPatientAttributes(plsr, "Survival")
      # $Survival    3.0   82.0  772.0 2620.5 3524.0
   
   loAge <- 82
   hiAge <- 3000

     # expect to see loading for  ELK4:   0.032747481  0.235092867
     #                      x          y
     # Survival.lo -0.1820622 -0.5035587
     # Survival.hi  0.1160127  0.0696906

   factor <- list(name="Survival", low=loAge,  high=hiAge)
   genes.to.use <- colnames(matrices(demoDz)$mtx.mrna.ueArray)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor), genes.to.use)
      })

   checkEqualsNumeric(as.numeric(x$loadings["ELK4",]), c(0.03274748, 0.23509287), tol=1e-4)
   checkEqualsNumeric(x$maxValue, 0.5035587, tole=1e-4)

   loAge <- 500
   hiAge <- 2000

   factor <- list(name="Survival", low=loAge,  high=hiAge)
   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor), genes.to.use)
      })
   
  checkEqualsNumeric(as.numeric(x$loadings["ELK4",]), c(0.02917796, 0.13417939), tol=1e-4)
  checkEqualsNumeric(x$maxValue, 0.4025156, tol=1e-4)

} # test_calculateSmall.survivalOnly
#----------------------------------------------------------------------------------------------------
test_calculateSmall <- function()
{
   printf("--- test_CalculateSmall")
   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")
   
   loAge <- 12000
   hiAge <- 28000
   loSurv <- 20
   hiSurv <- 3000

   factor1 <- list(name="AgeDx",    low=loAge,  high=hiAge)
   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)

   genes.to.use <- colnames(matrices(demoDz)$mtx.mrna.ueArray)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor1, factor2), genes.to.use)
      })

   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue, 0.410956, tol=10e-4)

   checkEquals(dim(x$loadings), c(64, 2))  # 64 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(4, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))
   
} # test_calculateSmall
#----------------------------------------------------------------------------------------------------
test_calculateBig <- function()
{
   printf("--- testCalculateBig")
   demoDz <- TCGAgbm()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")
   
     # use this plsr method to get value only for patients for whome we have expression data also
     # summarizeNumericPatientAttributes(plsr, "AgeDx")    # 7827 19090 22273 25665 32612
     # summarizeNumericPatientAttributes(plsr, "Survival") #    5  148  329  505 2681
   
   loAge <- 12000
   hiAge <- 28000
   loSurv <- 50
   hiSurv <- 1000

   factor1 <- list(name="AgeDx",    low=loAge,  high=hiAge)
   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor1, factor2), marker.genes.545)
      })

   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue,  0.1714565, tol=10e-4)

   checkEquals(dim(x$loadings), c(435, 2))  # 533 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(4, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))
   
} # test_calculateBig
#----------------------------------------------------------------------------------------------------
test_changeDataSetsAndCalculateSmall <- function()
{
   demoDz <- TCGAgbm()
   mrna.datasets <- sort(grep("mtx.mrna", manifest(demoDz)$variable, value=TRUE))
   expected <- c("mtx.mrna", "mtx.mrna.ueArray")
   checkTrue(length(intersect(expected, mrna.datasets)) >= 2)

   plsr <- PLSR(demoDz, "mtx.mrna")
   checkEquals(getDataMatrixName(plsr), "mtx.mrna")

   checkException(setDataMatrixName(plsr, "bogus"), silent=TRUE)
   plsr <- setDataMatrixName(plsr, "mtx.mrna")
   checkEquals(getDataMatrixName(plsr), "mtx.mrna")

     # use this plsr method to get value only for patients for whome we have expression data also
     # summarizeNumericPatientAttributes(plsr, "AgeDx")    # 7827 19090 22273 25665 32612
     # summarizeNumericPatientAttributes(plsr, "Survival") #    5  148  329  505 2681
   
   loAge <- 12000
   hiAge <- 28000
   loSurv <- 50
   hiSurv <- 1000

   factor1 <- list(name="AgeDx",    low=loAge,  high=hiAge)
   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor1, factor2), marker.genes.545)
      })

   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue,  0.1435327, tol=10e-4)

   checkEquals(dim(x$loadings), c(533, 2))  # 533 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(4, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))

      # now use the alternative TCGAgbm expression matrix

   set2 <- "mtx.mrna.ueArray"
   plsr <- setDataMatrixName(plsr, set2)
   checkEquals(getDataMatrixName(plsr), set2)

   suppressWarnings({
      x <- calculatePLSR(plsr, list(factor1, factor2), marker.genes.545)
      })

   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
   checkEqualsNumeric(x$maxValue,   0.1714565, tol=10e-4)

   checkEquals(dim(x$loadings), c(435, 2))  # 533 genes, x and y coordinates
   checkEquals(colnames(x$loadings), c("x", "y"))

   mtx.lv <- x$loadVectors
   checkEquals(dim(mtx.lv), c(4, 2))
   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
   checkEquals(colnames(mtx.lv), c("x", "y"))

} # test_changeDataSetsAndCalculateSmall
#----------------------------------------------------------------------------------------------------
explore_DEMOdz.bug <- function()
{
   print("--- explore_DEMOdz.bug")

   demoDz <- DEMOdz()
   checkEquals(grep("mtx.mrna", names(matrices(demoDz)), value=TRUE),
               c("mtx.mrna.ueArray", "mtx.mrna.bc"))

   plsr <- PLSR(demoDz, "mtx.mrna.bc")

   ageDx.summary <-  summarizeNumericPatientAttributes(plsr, "AgeDx")
   survival.summary <-  summarizeNumericPatientAttributes(plsr, "Survival")


   x <- 99

#   checkEquals(getDataMatrixName(plsr), "mtx.mrna")
#
#   checkException(setDataMatrixName(plsr, "bogus"), silent=TRUE)
#   plsr <- setDataMatrixName(plsr, "mtx.mrna")
#   checkEquals(getDataMatrixName(plsr), "mtx.mrna")
#
#     # use this plsr method to get value only for patients for whome we have expression data also
#     # summarizeNumericPatientAttributes(plsr, "AgeDx")    # 7827 19090 22273 25665 32612
#     # summarizeNumericPatientAttributes(plsr, "Survival") #    5  148  329  505 2681
#   
#   loAge <- 12000
#   hiAge <- 28000
#   loSurv <- 50
#   hiSurv <- 1000
#
#   factor1 <- list(name="AgeDx",    low=loAge,  high=hiAge)
#   factor2 <- list(name="Survival", low=loSurv, high=hiSurv)
#
#   suppressWarnings({
#      x <- calculatePLSR(plsr, list(factor1, factor2), marker.genes.545)
#      })
#
#   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
#   checkEqualsNumeric(x$maxValue,  0.1435327, tol=10e-4)
#
#   checkEquals(dim(x$loadings), c(533, 2))  # 533 genes, x and y coordinates
#   checkEquals(colnames(x$loadings), c("x", "y"))
#
#   mtx.lv <- x$loadVectors
#   checkEquals(dim(mtx.lv), c(4, 2))
#   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
#   checkEquals(colnames(mtx.lv), c("x", "y"))
#
#      # now use the alternative TCGAgbm expression matrix
#
#   set2 <- "mtx.mrna.ueArray"
#   plsr <- setDataMatrixName(plsr, set2)
#   checkEquals(getDataMatrixName(plsr), set2)
#
#   suppressWarnings({
#      x <- calculatePLSR(plsr, list(factor1, factor2), marker.genes.545)
#      })
#
#   checkEquals(sort(names(x)), c("loadVectors", "loadings", "maxValue"))
#   checkEqualsNumeric(x$maxValue,   0.1714565, tol=10e-4)
#
#   checkEquals(dim(x$loadings), c(435, 2))  # 533 genes, x and y coordinates
#   checkEquals(colnames(x$loadings), c("x", "y"))
#
#   mtx.lv <- x$loadVectors
#   checkEquals(dim(mtx.lv), c(4, 2))
#   checkEquals(rownames(mtx.lv), c("AgeDx.lo", "AgeDx.hi", "Survival.lo", "Survival.hi"))
#   checkEquals(colnames(mtx.lv), c("x", "y"))
#
   
} # explore_DEMOdz.bug 
#----------------------------------------------------------------------------------------------------
yarn.demo <- function()
{
   data(yarn)
   length(yarn$density) #  [1] 28
   head(yarn$density) # [1] 100.00  80.22  79.49  60.80  59.97  60.48
   dim(yarn$NIR) #   28 268
   fit <- plsr(density ~ NIR, 6, data = yarn, validation = "CV")
   fit$loadings[1:5,]
     #           Comp 1     Comp 2      Comp 3      Comp 4     Comp 5    Comp 6
     # NIR1 0.006624595 0.01541745 -0.11640127 -0.03204442 0.07962307 0.2412930
     # NIR2 0.021328973 0.03259607 -0.14381693 -0.06087295 0.05182201 0.3594300
     # NIR3 0.039077717 0.05674406 -0.13569282 -0.08747246 0.04624422 0.4101578
     # NIR4 0.051820977 0.08249987 -0.08872902 -0.07558241 0.07081909 0.3582620
     # NIR5 0.053751036 0.10449611 -0.03355491 -0.05629290 0.08072021 0.2466096

    
} # yarn.demo
#----------------------------------------------------------------------------------------------------
bug <- function()
{
   demoDz <- DEMOdz()
   plsr <- PLSR(demoDz, "mtx.mrna.ueArray")
   mtx.mrna <- matrices(demoDz)$mtx.mrna
   tbl.pt <- getPatientTable(demoDz)

   goi <- c("PRRX1", "UPF1", "PIPOX", "PIM1", "UCP2", "USH2A", "TTN", "ELF4", "U2AF1",
            "ELOVL2", "PIK3C2B", "PTPRA", "USP6", "EDIL3", "PTPN14", "EHD2", "EGFR",
            "PIK3CG", "ELK4", "TTC3", "EIF4A2", "PIK3R2", "EMP3", "PIK3CA", "TTC28", "EED",
            "UGT8", "PLAUR", "PTEN", "EEF2", "PTPN6", "PTK2", "TTPA", "PIK3CD", "PTPN22",
            "PRR4", "EML4", "PTBP1", "UBR5", "TYK2")

   loAge <- 16435.80
   hiAge <- 24105.84
   loSurvival <- 1096.72
   hiSurvival <- 2556.68

   factor.age <- list(name="AgeDx", low=loAge,  high=hiAge)
   factor.survival <- list(name="Survival", low=loSurvival,  high=hiSurvival)
   factor.survival.empty <- list(name="Survival", low=0,  high=64000)

   x <- calculatePLSR(plsr, list(factor.age, factor.survival), goi)


} # bug
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
