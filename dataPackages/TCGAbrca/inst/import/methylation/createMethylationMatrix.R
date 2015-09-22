library(RUnit)
#================Create HM450 R data================
table.meth <- read.table(file="../../../../RawData/TCGAbrca/mysql_cbio_methHM450.csv", header=F, skip=3, as.is=T)
## 451 samples(patients) x 16183 genes

sampleString <- readLines(con="../../../../RawData/TCGAbrca/mysql_cbio_methHM450.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAbrca/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(737, 16094))
checkEquals(length(which(is.na(mtx.meth))), 4194)   #
checkEquals(mtx.meth["TCGA.A7.A4SA.01", "NIP7"], 0.02197267, tolerance=5)
checkEquals(fivenum(mtx.meth), c(0.003091941, 0.046411675, 0.342651862, 0.766786129, 0.996213304))

save(mtx.meth, file="../../extdata/mtx.methHM450.RData")

#================Create HM27 R data================

table.meth <- read.table(file="../../../../RawData/TCGAbrca/mysql_cbio_methHM27.csv", header=F, skip=3, as.is=T)
## 126 samples(patients) x 1637 genes

sampleString <- readLines(con="../../../../RawData/TCGAbrca/mysql_cbio_methHM27.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAbrca/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(313, 1659))
checkEquals(length(which(is.na(mtx.meth))), 304)   #
checkEquals(mtx.meth["TCGA.AN.A0FX.01", "RBM24"], 0.9308392)
checkEquals(fivenum(mtx.meth), c(0.003548976, 0.041815554, 0.244927130, 0.709312130, 0.995963449))

save(mtx.meth, file="../../extdata/mtx.methHM27.RData")

