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
library(R.utils)
#--------------------mrna_seq------------------------
table.mrna <- read.table(file="../../../../RawData/TCGAhnsc/mysql_cbio_mrna.csv", header=F, skip=3, as.is=T)
## 490 samples(patients) x 20444 genes

sampleString <- readLines(con="../../../../RawData/TCGAhnsc/mysql_cbio_mrna.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAhnsc/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


EntrezGenes <- table.mrna[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.mrna <- table.mrna[,-c(1,2)]
list.mrna <- strsplit(table.mrna, ",")
mtx.mrna <- matrix(as.double(unlist(list.mrna)), nrow = length(samples), byrow = F)
dimnames(mtx.mrna) <- list(BarcodeSample,HugoGenes)

checkEquals(dim(mtx.mrna), c(498, 20444))
  # all good values
checkEquals(length(which(is.na(mtx.mrna))), 712638)
checkEquals(fivenum(mtx.mrna), c(-4.8275, -0.5242, -0.2022, 0.2832, 19168.5583))
                                 
save(mtx.mrna, file="../../extdata/mtx.mrna.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))## couldn't run
