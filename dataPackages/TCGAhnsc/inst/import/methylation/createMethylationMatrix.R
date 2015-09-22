library(RUnit)
## Create HM450 R data
table.meth <- read.table(file="../../../../RawData/TCGAhnsc/mysql_cbio_methHM450.csv", header=F, skip=3, as.is=T)
## 451 samples(patients) x 16183 genes

sampleString <- readLines(con="../../../../RawData/TCGAhnsc/mysql_cbio_methHM450.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAhnsc/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
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

checkEquals(dim(mtx.meth), c(530, 16132))
checkEquals(length(which(is.na(mtx.meth))), 2882)   #
checkEquals(mtx.meth["TCGA.4P.AA8J.01", "DSC1"], 0.6682006, tolerance=5)
checkEquals(fivenum(mtx.meth), c(0.00571503,0.04869845,0.29399197,0.68512527,0.99570131))

save(mtx.meth, file="../../extdata/mtx.methHM450.RData")

