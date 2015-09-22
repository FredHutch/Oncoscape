library(RUnit)
## Create HM450 R data
table.meth <- read.table(file="../../../../RawData/TCGAcoadread/mysql_cbio_methHM450.csv", header=F, skip=3, as.is=T)
## 359 samples(patients) x 16183 genes

sampleString <- readLines(con="../../../../RawData/TCGAcoadread/mysql_cbio_methHM450.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAcoadread/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(383,15915))
checkEquals(length(which(is.na(mtx.meth))), 4253)   #
checkEquals(mtx.meth["TCGA.AZ.5407.01", "MMP3"], 0.9412097,tolerance = .Machine$double.eps^0.4)
checkEquals(fivenum(mtx.meth), c(0.005459927,0.056351668,0.341157328,0.754421383 ,0.994947172))

save(mtx.meth, file="../../extdata/mtx.methHM450.RData")
## Create HM27 R data
table.meth <- read.table(file="../../../../RawData/TCGAcoadread/mysql_cbio_methHM27.csv", header=F, skip=3, as.is=T)
## 133 samples(patients) x 1637 genes

sampleString <- readLines(con="../../../../RawData/TCGAcoadread/mysql_cbio_methHM27.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAcoadread/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(233, 1667))
checkEquals(length(which(is.na(mtx.meth))), 294)   #
checkEquals(mtx.meth["TCGA.AA.3950.01", "PCK1"], 0.6142279,tolerance = .Machine$double.eps^0.4)
checkEquals(fivenum(mtx.meth), c(0.005000012,0.035148311,0.194938356,0.669760796,0.994361464))

save(mtx.meth, file="../../extdata/mtx.methHM27.RData")

