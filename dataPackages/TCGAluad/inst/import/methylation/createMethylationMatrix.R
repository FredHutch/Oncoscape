library(RUnit)
## Create HM450 R data
table.meth <- read.table(file="../../../../RawData/TCGAluad/mysql_cbio_methHM450.csv", header=F, skip=3, as.is=T)
## 451 samples(patients) x 16183 genes

sampleString <- readLines(con="../../../../RawData/TCGAluad/mysql_cbio_methHM450.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAluad/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(451, 16183))
checkEquals(length(which(is.na(mtx.meth))), 3165)   #
checkEquals(mtx.meth["TCGA.80.5608.01", "DSC1"], 0.677655235)
checkEquals(fivenum(mtx.meth), c(0.005455252, 0.056625729, 0.350787458, 0.727525677, 0.994087466))

save(mtx.meth, file="../../extdata/mtx.methHM450.RData")
## Create HM27 R data
table.meth <- read.table(file="../../../../RawData/TCGAluad/mysql_cbio_methHM27.csv", header=F, skip=3, as.is=T)
## 126 samples(patients) x 1637 genes

sampleString <- readLines(con="../../../../RawData/TCGAluad/mysql_cbio_methHM27.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAluad/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(126, 1637))
checkEquals(length(which(is.na(mtx.meth))), 1529)   #
checkEquals(mtx.meth["TCGA.38.4629.01", "GID8"], 0.02951626)
checkEquals(fivenum(mtx.meth), c(0.004523024, 0.048455925, 0.268191252, 0.672910534, 0.994422364))

save(mtx.meth, file="../../extdata/mtx.methHM27.RData")

