library(RUnit)

load(file="../../../../TCGAgbm/inst/extdata/mtx.meth.RData")
tbl.TCGAgbm <- mtx.meth
checkEquals(dim(tbl.TCGAgbm), c(288, 9444))

load(file="../../../../TCGAlgg/inst/extdata/mtx.meth.RData")
tbl.TCGAlgg <- mtx.meth
checkEquals(dim(tbl.TCGAlgg), c(530, 16223))

genes.gbm <- colnames(tbl.TCGAgbm)
genes.lgg <- colnames(tbl.TCGAlgg)

Addgene <- setdiff(genes.gbm, genes.lgg)
if(length(Addgene)>0) tbl.TCGAlgg <- cbind(tbl.TCGAlgg, matrix(NA, nrow=nrow(tbl.TCGAlgg), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlgg),Addgene)))
Addgene <- setdiff(genes.lgg, genes.gbm)
if(length(Addgene)>0) tbl.TCGAgbm <- cbind(tbl.TCGAgbm, matrix(NA, nrow=nrow(tbl.TCGAgbm), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAgbm),Addgene)))

HugoGenes <- unique(c(genes.gbm, genes.lgg))
checkEquals(length(HugoGenes), ncol(tbl.TCGAgbm))
checkEquals(length(HugoGenes), ncol(tbl.TCGAlgg))

tbl.TCGAlgg <- tbl.TCGAlgg[, colnames(tbl.TCGAgbm)]
mtx.meth <- rbind(tbl.TCGAgbm, tbl.TCGAlgg)

checkEquals(nrow(mtx.meth), nrow(tbl.TCGAgbm) + nrow(tbl.TCGAlgg) )

checkEquals(fivenum(mtx.meth), c(0.00000, 0.04630, 0.24322, 0.80151, 0.99790))
save(mtx.meth, file="../../extdata/mtx.meth.RData")
