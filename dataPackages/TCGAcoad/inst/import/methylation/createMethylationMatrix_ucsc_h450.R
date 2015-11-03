library(RUnit)

table.meth <- read.table(file="../../../../RawData/TCGAgbm/TCGA_GBM_hMethyl450-2015-02-24/genomicMatrix", header=T,row.names=1, as.is=T)
## 155 samples(patients) x 485577 probes

BarcodeSample <- gsub("\\-", "\\.", colnames(table.meth))
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)
colnames(table.meth) <- BarcodeSample

#probes <- rownames(table.meth)
#genes.tbl <- read.delim(file="../../../../RawData/TCGA_GBM_hMethyl27-2015-02-24/probes", header=T, as.is=T, sep="\t")
#HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- t(table.meth)     # put samples as rows and genes as columns
table.meth <- table.meth + 0.5  # reset beta values to [0,1]
mtx.meth450.probe <- table.meth

checkEquals(dim(mtx.meth450.probe), c(155, 485577))
checkEquals(length(which(is.na(mtx.meth450.probe))), 13931695)   # 
checkEquals(mtx.meth450.probe["TCGA.14.1402", "cg13332474"], 0.0242)
checkEquals(fivenum(mtx.meth450.probe), c(0.0043, 0.0564, 0.4648, 0.8536, 0.9963))

save(mtx.meth450.probe, file="../../extdata/mtx.meth450.probe.RData")


