# createMatrix.R
# the mrna comes from cBio 2013 TCGA coadread expression data set
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
#options(stringsAsFactors=FALSE)

table.mrna <- read.table(file="../../../../RawData/TCGAcoadread/mysql_cbio_mrna2013_Seq.csv", header=F, skip=3, as.is=T)
## 155 samples(patients) x 17212 genes

sampleString <- readLines(con="../../../../RawData/TCGAcoadread/mysql_cbio_mrna2013_Seq.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAcoadread/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


EntrezGenes <- table.mrna[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.mrna <- table.mrna[,-c(1,2)]
list.mrna <- strsplit(table.mrna, ",")
mtx.mrna <- matrix(as.double(unlist(list.mrna)), nrow = length(samples), byrow = F)
dimnames(mtx.mrna) <- list(BarcodeSample,HugoGenes)

checkEquals(dim(mtx.mrna), c(365,20444))
  # all good values
checkEquals(length(which(is.na(mtx.mrna))),588380)
checkEquals(fivenum(mtx.mrna), c( -5.8288, -0.5422,  -0.1750, 0.3700,15252.2394))
                                 
save(mtx.mrna, file="../../extdata/mtx.mrna_Seq.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))## couldn't run
#----------------------------------------------------------------------------------------------------
U133=FALSE
if(U133){
    table.mrna <- read.table(file="../../../../RawData/TCGAcoadread/mysql_cbio_mrna2013_U133.csv", header=F, skip=3, as.is=T)
    ## 155 samples(patients) x 17212 genes

    sampleString <- readLines(con="../../../../RawData/TCGAcoadread/mysql_cbio_mrna2013_U133.csv", n=2)[[2]]
    samples <- strsplit(sampleString, "\t")[[1]][2]
    samples <- strsplit(samples, ",")[[1]]
    sample.tbl <- read.delim(file="../../../../RawData/TCGAcoadread/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
    BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
    BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


    EntrezGenes <- table.mrna[,2]
    genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
    HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

    table.mrna <- table.mrna[,-c(1,2)]
    list.mrna <- strsplit(table.mrna, ",")
    mtx.mrna <- matrix(as.double(unlist(list.mrna)), nrow = length(samples), byrow = F)
    dimnames(mtx.mrna) <- list(BarcodeSample,HugoGenes)

    checkEquals(dim(mtx.mrna), c(133,11878))
    # all good values
    checkEquals(length(which(is.na(mtx.mrna))),18354)
    checkEquals(fivenum(mtx.mrna), c( -9.9347,-0.6941 ,-0.0825 , 0.6419 ,61.9539))

    save(mtx.mrna, file="../../extdata/mtx.mrna_U133.RData")
    printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))## couldn't run
}
#----------------------------------------------------------------------------------------------------
table.mrna <- read.table(file="../../../../RawData/TCGAcoadread/mysql_cbio_mrna2013_Agi.csv", header=F, skip=3, as.is=T)
## 155 samples(patients) x 17212 genes

sampleString <- readLines(con="../../../../RawData/TCGAcoadread/mysql_cbio_mrna2013_Agi.csv", n=2)[[2]]
samples <- strsplit(sampleString, "\t")[[1]][2]
samples <- strsplit(samples, ",")[[1]]
sample.tbl <- read.delim(file="../../../../RawData/TCGAcoadread/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)


EntrezGenes <- table.mrna[,2]
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.mrna <- table.mrna[,-c(1,2)]
list.mrna <- strsplit(table.mrna, ",")
mtx.mrna <- matrix(as.double(unlist(list.mrna)), nrow = length(samples), byrow = F)
dimnames(mtx.mrna) <- list(BarcodeSample,HugoGenes)

checkEquals(dim(mtx.mrna), c(222,17212))
# all good values
checkEquals(length(which(is.na(mtx.mrna))),72787)
checkEquals(fivenum(mtx.mrna), c(-16.0758,-0.6770,-0.0136, 0.6731,17.9217))

save(mtx.mrna, file="../../extdata/mtx.mrna_Agi.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))## couldn't run
