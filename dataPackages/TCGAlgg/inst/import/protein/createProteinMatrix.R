# createMatrix.R
# the mrna comes from cBio 2013 TCGA lgg expression data set
# the serialized result is written to extdata, as a numerical matrix  conforming to
# oncoscape protocols:
#
#   NA for missing values
#   sample names for rownames
#   gene symbols for colnames
#   policies yet to be worked out for gene isoforms and multiple measurements for each sample
#
#----------------------------------------------------------------------------------------------------
library(RUnit)

table.prot <- read.table(file="../../../../RawData/TCGAlgg/mysql_cbio_prot.txt", header=T, as.is=T)
## 49140 samples x gene protein changes

samples <- unique(table.prot[,"sample_id"])
sample.tbl <- read.delim(file="../../../../RawData/TCGAlgg/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)

## 260 samples

ProteinID <- unique(table.prot[,"protein_array_id"])
## 189 genes

mtx.prot <- matrix(NA, nrow = length(samples),ncol=length(ProteinID))
dimnames(mtx.prot) <- list(samples,ProteinID)

for(pt in samples){
  changes <- which(table.prot$sample_id == pt)
  pt.prot <- table.prot[changes, "protein_array_id"]
  pt.abund <- table.prot[changes, "abundance"]

  mtx.prot[as.character(pt),sapply(pt.prot, as.character)] <- pt.abund 
}

rownames(mtx.prot) <- BarcodeSample

checkEquals(mtx.prot["TCGA.CS.4938", "14-3-3_beta-R-V"], -0.004914261)
checkEquals(fivenum(mtx.prot), c(-5.49454639, -0.64817849, -0.08121155,  0.56151266,  9.79907304))

checkEquals(dim(mtx.prot), c(260, 189))
checkEquals(length(which(is.na(mtx.prot))), 0)   # all null values stored as emptry strings - no NAs

checkTrue(all(unlist(lapply(mtx.prot, class), use.names=FALSE) == "numeric"))
save(mtx.prot, file="../../extdata/mtx.prot.RData")
