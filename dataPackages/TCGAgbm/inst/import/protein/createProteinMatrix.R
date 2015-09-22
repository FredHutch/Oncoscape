# createMatrix.R
# the mrna comes from cBio 2013 TCGA gbm expression data set
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

table.prot <- read.table(file="../../../../RawData/TCGAgbm/mysql_cbio_prot.txt", header=T, as.is=T)
## 36594 samples x gene protein changes

samples <- unique(table.prot[,"sample_id"])
sample.tbl <- read.delim(file="../../../../RawData/TCGAgbm/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)

## 214 samples

ProteinID <- unique(table.prot[,"protein_array_id"])
## 171 proteins

mtx.prot <- matrix(NA, nrow = length(samples),ncol=length(ProteinID))
dimnames(mtx.prot) <- list(samples,ProteinID)

for(pt in samples){
  changes <- which(table.prot$sample_id == pt)
  pt.prot <- table.prot[changes, "protein_array_id"]
  pt.abund <- table.prot[changes, "abundance"]

  mtx.prot[as.character(pt),sapply(pt.prot, as.character)] <- pt.abund 
}

rownames(mtx.prot) <- BarcodeSample

checkEquals(mtx.prot["TCGA.02.0003", "14-3-3_epsilon-M-C"], -0.56391151)
checkEquals(fivenum(mtx.prot), c(-5.6243737, -0.6122669, -0.0811811,  0.5379014, 10.3052329))

checkEquals(dim(mtx.prot), c(214, 171))
checkEquals(length(which(is.na(mtx.prot))), 0)   #  no NAs

checkTrue(all(unlist(lapply(mtx.prot, class), use.names=FALSE) == "numeric"))
save(mtx.prot, file="../../extdata/mtx.prot.RData")
