library(RUnit)

table.meth <- read.table(file="../../../../RawData/TCGAgbm/mysql_cbio_meth.csv", header=F, skip=3, as.is=T)
## 288 samples(patients) x 9444 genes

sampleString <- readLines(con="../../../../RawData/TCGAgbm/mysql_cbio_meth.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAgbm/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)

EntrezGenes <- table.meth[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- table.meth[,-c(1,2)]
list.meth <- strsplit(table.meth, ",")
vector.meth <- unlist(list.meth)
#grepl("\\d+\\.\\d*", vector.meth)
vector.meth[grepl("NA", vector.meth)] <- NA
mtx.meth <- matrix(round(as.double(vector.meth), digits=5), nrow = length(samples), byrow = F)
dimnames(mtx.meth) <- list(BarcodeSample,HugoGenes)

checkEquals(dim(mtx.meth), c(288, 9444))
checkEquals(length(which(is.na(mtx.meth))), 4317)   # 
checkEquals(mtx.meth["TCGA.02.0001", "IMPA2"], 0.03983853, tolerance=10e-5)
checkEquals(fivenum(mtx.meth), c(0.00000, 0.03695, 0.08300, 0.44657, 0.99790))

save(mtx.meth, file="../../extdata/mtx.meth.RData")


