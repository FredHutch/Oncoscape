library(RUnit)
## Create HM450 R data
table.meth <- read.table(file="../../../../RawData/TCGAlusc/mysql_cbio_methHM450.csv", header=F, skip=3, as.is=T)
## 359 samples(patients) x 16183 genes

sampleString <- readLines(con="../../../../RawData/TCGAlusc/mysql_cbio_methHM450.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAlusc/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


EntrezGenes <- table.meth[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- table.meth[,-c(1,2)]
list.meth <- strsplit(table.meth, ",")
vector.meth <- unlist(list.meth)
#grepl("\\d+\\.\\d*", vector.meth)
vector.meth[grepl("NA", vector.meth)] <- NA
mtx.meth <- matrix(as.double(vector.meth), nrow = length(samples), byrow = F)
dimnames(mtx.meth) <- list(BarcodeSample,HugoGenes)

checkEquals(dim(mtx.meth), c(359, 16350))
checkEquals(length(which(is.na(mtx.meth))), 2062)   #
checkEquals(mtx.meth["TCGA.77.7142.01", "SOCS2"], 0.9085032)
checkEquals(fivenum(mtx.meth), c(0.004365384, 0.051210670, 0.317734969, 0.707275083, 0.995690633))

save(mtx.meth, file="../../extdata/mtx.methHM450.RData")
## Create HM27 R data
table.meth <- read.table(file="../../../../RawData/TCGAlusc/mysql_cbio_methHM27.csv", header=F, skip=3, as.is=T)
## 133 samples(patients) x 1637 genes

sampleString <- readLines(con="../../../../RawData/TCGAlusc/mysql_cbio_methHM27.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAlusc/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


EntrezGenes <- table.meth[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- table.meth[,-c(1,2)]
list.meth <- strsplit(table.meth, ",")
vector.meth <- unlist(list.meth)
#grepl("\\d+\\.\\d*", vector.meth)
vector.meth[grepl("NA", vector.meth)] <- NA
mtx.meth <- matrix(as.double(vector.meth), nrow = length(samples), byrow = F)
dimnames(mtx.meth) <- list(BarcodeSample,HugoGenes)

checkEquals(dim(mtx.meth), c(133, 1645))
checkEquals(length(which(is.na(mtx.meth))), 489)   #
checkEquals(mtx.meth["TCGA.66.2753.01", "SURF2"], 0.6833827,tolerance = .Machine$double.eps^0.4)
checkEquals(fivenum(mtx.meth), c(0.005379396, 0.039297680, 0.197796232, 0.616313866, 0.992718453))

save(mtx.meth, file="../../extdata/mtx.methHM27.RData")

