library(RUnit)

table.meth <- read.table(file="../../../../RawData/TCGAlgg/TCGA_LGG_hMethyl450-2015-02-24/genomicMatrix", header=T,row.names=1, as.is=T)
## 530 samples(patients) x 485577 genes

BarcodeSample <- gsub("\\-", "\\.", colnames(table.meth))
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)
colnames(table.meth) <- BarcodeSample

#probes <- rownames(table.meth)
#genes.tbl <- read.delim(file="../../../../RawData/TCGA_LGG_hMethyl27-2015-02-24/probes", header=T, as.is=T, sep="\t")
#HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- t(table.meth)     # put samples as rows and genes as columns
table.meth <- table.meth + 0.5  # reset beta values to [0,1]
mtx.meth450.probe <- table.meth

checkEquals(dim(mtx.meth450.probe), c(530, 485577))
checkEquals(length(which(is.na(mtx.meth450.probe))), 47611722)   # 
checkEquals(mtx.meth450.probe["TCGA.E1.5319", "cg13332474"], 0.4019)
checkEquals(fivenum(mtx.meth450.probe), c(0.0038, 0.0617, 0.6496, 0.8981, 0.9964))

save(mtx.meth450.probe, file="../../extdata/mtx.meth450.probe.RData")


