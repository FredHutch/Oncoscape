library(RUnit)

table.cn <- read.table(file="../../../../RawData/TCGAhnsc/mysql_cbio_cna.csv", header=F, skip=3, as.is=T)
## 522 samples(patients) x 22184 genes

sampleString <- readLines(con="../../../../RawData/TCGAhnsc/mysql_cbio_cna.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAhnsc/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


EntrezGenes <- table.cn[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.cn <- table.cn[,-c(1,2)]
list.cn <- strsplit(table.cn, ",")
mtx.cn <- matrix(as.integer(unlist(list.cn)), nrow =length(BarcodeSample), byrow = F)
dimnames(mtx.cn) <- list(BarcodeSample,HugoGenes)

checkEquals(as.list(table(mtx.cn)), list(`-2`=50646,`-1`=2232356,  `0`=6906774, `1`=2231748, `2`=158524))
save(mtx.cn, file="../../extdata/mtx.cn.RData")


