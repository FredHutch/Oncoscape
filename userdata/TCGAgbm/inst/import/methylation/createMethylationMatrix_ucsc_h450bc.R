library(RUnit)

load("../../../../RawData/TCGAgbm/batchCorrected.tcgaGBM.me450.RData")
table.meth <- tcgaGBM.me450
## 485512 probes x 155 samples (142 patients) 

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
table.meth <- round(table.meth, digits=5)
mtx.meth450.bc.probe <- table.meth

checkEquals(dim(mtx.meth450.bc.probe), c(142, 485512))
checkEquals(length(which(is.na(mtx.meth450.bc.probe))),0)   # 
checkEquals(mtx.meth450.bc.probe["TCGA.14.1402", "cg13332474"], 0.02384)
checkEquals(fivenum(mtx.meth450.bc.probe), c(0.00000, 0.06858, 0.54207, 0.85413, 0.99757))

save(mtx.meth450.bc.probe, file="../../extdata/mtx.meth450.bc.probe.RData")


