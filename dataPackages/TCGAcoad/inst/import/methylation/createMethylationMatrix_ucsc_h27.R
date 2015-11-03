library(RUnit)

table.meth <- read.table(file="../../../../RawData/TCGAgbm/TCGA_GBM_hMethyl27-2015-02-24/genomicMatrix", header=T,row.names=1, as.is=T)
## 288 samples(patients) x 27578 probes

BarcodeSample <- gsub("\\-", "\\.", colnames(table.meth))
BarcodeSample <- gsub("\\.\\d\\d$", "", BarcodeSample)
colnames(table.meth) <- BarcodeSample

#probes <- rownames(table.meth)
#genes.tbl <- read.delim(file="../../../../RawData/TCGA_GBM_hMethyl27-2015-02-24/probes", header=T, as.is=T, sep="\t")
#HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]

table.meth <- t(table.meth)     # put samples as rows and genes as columns
table.meth <- table.meth + 0.5  # reset beta values to [0,1]
mtx.meth27.probe <- table.meth

checkEquals(dim(mtx.meth27.probe), c(288, 27578))
checkEquals(length(which(is.na(mtx.meth27.probe))), 760748)   # 
checkEquals(mtx.meth27.probe["TCGA.06.0881", "cg00000292"], 0.7502)
checkEquals(fivenum(mtx.meth27.probe), c(0.0018, 0.0182, 0.0480, 0.5155, 0.9980))

save(mtx.meth27.probe, file="../../extdata/mtx.meth27.probe.RData")


