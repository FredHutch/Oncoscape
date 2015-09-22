# createMatrix.R
# this simple script creates two expression matrices
# The first is an intentionally small numerical matrix with highly variable
# genes, 10 long surviving patients, and 10 short.
# the patients were obtained manually from the oncoscape demo clinical data table.
# the mrna comes from the set the "unified expression" TCGA GBM expression data set
#
# the second expression matrix uses all 141 patients with RNAseq data and samples the same 64 genes
# the serialized result is written to extdata, as a numerical matrix  conforming to
# oncoscape protocols:
#
#   NA for missing values
#   sample names for rownames
#   gene symbols for colnames
#   policies yet to be worked out for gene isoforms and multiple measurements for each sample
#
#----------------------------------------------------------------------------------------------------
##########
library(RUnit)

table.mrna <- read.table(file="../../../../RawData/TCGAgbm/ueGbmBatches1to10and16.txt", header=T,row.names=1, as.is=T)
## 334 samples x 11864 genes

BarcodeSample <- colnames(table.mrna)
BarcodeSample <- gsub("\\w\\.\\d\\d\\w$", "", BarcodeSample)

Deleters <- which(sapply(BarcodeSample, function(id) grepl("\\.11$|\\.20$", id)))
colnames(table.mrna) <- gsub("\\.\\d\\d$", "", BarcodeSample)

table.mrna <- table.mrna[,-Deleters]

table.mrna <- round(table.mrna, digits=5)
mtx.mrna.ueArray <- t(table.mrna)

print(load("../sharedPatientsAndGenes.RData"))
mtx.mrna.ueArray <- as.matrix(mtx.mrna.ueArray[patients,genes])

checkEquals(dim(mtx.mrna.ueArray), c(20, 64))
  # all good values
checkEquals(length(which(is.na(mtx.mrna.ueArray))), 0)
checkEquals(fivenum(mtx.mrna.ueArray), c(-4.098870, -0.747000, -0.012800,  0.718805,  5.870990))
                                                                 
save(mtx.mrna.ueArray, file="../../extdata/mtx.mrna.ueArray.RData")
printf("saved mtx.mrna.ueArray (%d, %d) to parent directory", nrow(mtx.mrna.ueArray), ncol(mtx.mrna.ueArray))

############
load("../../../../RawData/TCGAbrain/combatAdjustedExp654gdBatchesNormLGGNormGBM.RData")
table.mrna <- adjustedExpCombat
## 18641 genes x 654 samples 

load("../../../../RawData/TCGAgbm/allExp172SampleIDsGBM.RData")
gbm.exp.samples <- intersect(colnames(table.mrna), samplesGBM)

table.mrna <- table.mrna[,gbm.exp.samples]
mtx.mrna.bc <- t(table.mrna)

rownames(mtx.mrna.bc) <- gsub("\\.\\d\\d$", "", rownames(mtx.mrna.bc))
print(load("../sharedPatientsAndGenes.RData"))
mtx.mrna.bc <- as.matrix(mtx.mrna.bc[,genes])
mtx.mrna.bc <- round(mtx.mrna.bc, digits=5)

checkEquals(dim(mtx.mrna.bc), c(141, 64))
  # all good values
checkEquals(length(which(is.na(mtx.mrna.bc))), 0)
checkEquals(fivenum(mtx.mrna.bc), c(-0.234010,  0.837845,  1.340940,  1.733705,  2.409100))
                                 
save(mtx.mrna.bc, file="../../extdata/mtx.mrna.bc.RData")
printf("saved mtx.mrna.bc (%d, %d) to parent directory", nrow(mtx.mrna.bc), ncol(mtx.mrna.bc))
