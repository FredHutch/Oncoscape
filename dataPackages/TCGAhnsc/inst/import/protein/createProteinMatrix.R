# createMatrix.R
# the mrna comes from cBio 2013 TCGA hnsc expression data set
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

table.prot <- read.table(file="../../../../RawData/TCGAhnsc/mysql_cbio_prot.txt", header=T, as.is=T)
## 36594 samples x gene protein changes

samples <- unique(table.prot[,"sample_id"])
sample.tbl <- read.delim(file="../../../../RawData/TCGAhnsc/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)
## 212 samples

ProteinID <- unique(table.prot[,"protein_array_id"])
## 160 proteins

mtx.prot <- matrix(NA, nrow = length(samples),ncol=length(ProteinID))
dimnames(mtx.prot) <- list(samples,ProteinID)

for(pt in samples){
  changes <- which(table.prot$sample_id == pt)
  pt.prot <- table.prot[changes, "protein_array_id"]
  pt.abund <- table.prot[changes, "abundance"]

  mtx.prot[as.character(pt),sapply(pt.prot, as.character)] <- pt.abund 
}

rownames(mtx.prot) <- BarcodeSample

checkEquals(mtx.prot["TCGA.BA.4074.01", "Claudin-7-R-V"], -1.167338153, tolerance= 5 )
checkEquals(fivenum(mtx.prot), c(-6.11242466, -0.65566928, -0.05885827, 0.58408860, 10.09583254))

checkEquals(dim(mtx.prot), c(212, 160))
checkEquals(length(which(is.na(mtx.prot))), 0)   #  no NAs

checkTrue(all(unlist(lapply(mtx.prot, class), use.names=FALSE) == "numeric"))
save(mtx.prot, file="../../extdata/mtx.prot.RData")
