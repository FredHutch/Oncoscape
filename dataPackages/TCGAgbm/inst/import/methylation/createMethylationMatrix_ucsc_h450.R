library(RUnit)

table.meth <- read.table(file="../../../../RawData/TCGAgbm/TCGA_GBM_hMethyl450-2015-02-24/genomicMatrix", header=T,row.names=1, as.is=T)
## 155 samples(patients) x 485577 probes

BarcodeSample <- gsub("\\-", "\\.", colnames(table.meth))
Deleters <- which(sapply(BarcodeSample, function(id) grepl("\\.02$", id)))
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)
colnames(table.meth) <- BarcodeSample

table.meth <- table.meth[,-Deleters]
# remove recurrent tumor samples

#probes <- rownames(table.meth)
#genes.tbl <- read.delim(file="../../../../RawData/TCGA_GBM_hMethyl27-2015-02-24/probes", header=T, as.is=T, sep="\t")
#HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- t(table.meth)     # put samples as rows and genes as columns
table.meth <- table.meth + 0.5  # reset beta values to [0,1]
mtx.meth450.probe <- table.meth

#Deleters <- which(apply(mtx.meth450.probe,2, function(samples) all(is.na(samples))))
# keep all probes, even if all samples have NA

checkEquals(dim(mtx.meth450.probe), c(142, 485577))
checkEquals(length(which(is.na(mtx.meth450.probe))),  12760505)   # 
checkEquals(mtx.meth450.probe["TCGA.14.1402", "cg13332474"], 0.0241)
checkEquals(fivenum(mtx.meth450.probe), c(0.0043, 0.0560, 0.4606, 0.8529, 0.9963))

save(mtx.meth450.probe, file="../../extdata/mtx.meth450.probe.RData")


