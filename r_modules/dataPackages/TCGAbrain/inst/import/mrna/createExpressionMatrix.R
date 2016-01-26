library(RUnit)

load(file="../../../../TCGAgbm/inst/extdata/mtx.mrna.RData")
tbl.TCGAgbm <- mtx.mrna
checkEquals(dim(tbl.TCGAgbm), c(154, 20457))

load(file="../../../../TCGAlgg/inst/extdata/mtx.mrna.RData")
tbl.TCGAlgg <- mtx.mrna
checkEquals(dim(tbl.TCGAlgg), c(527, 20444))

genes.gbm <- colnames(tbl.TCGAgbm)
genes.lgg <- colnames(tbl.TCGAlgg)

Addgene <- setdiff(genes.gbm, genes.lgg)
if(length(Addgene)>0) tbl.TCGAlgg <- cbind(tbl.TCGAlgg, matrix(NA, nrow=nrow(tbl.TCGAlgg), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlgg),Addgene)))
Addgene <- setdiff(genes.lgg, genes.gbm)
if(length(Addgene)>0) tbl.TCGAgbm <- cbind(tbl.TCGAgbm, matrix(NA, nrow=nrow(tbl.TCGAgbm), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAgbm),Addgene)))

HugoGenes <- unique(c(genes.gbm, genes.lgg))
checkEquals(length(HugoGenes), ncol(tbl.TCGAgbm))
checkEquals(length(HugoGenes), ncol(tbl.TCGAlgg))

mtx.mrna <- rbind(tbl.TCGAgbm, tbl.TCGAlgg)

checkEquals(nrow(mtx.mrna), nrow(tbl.TCGAgbm) + nrow(tbl.TCGAlgg) )

checkEquals(dim(mtx.mrna), c(681, 20457))
  # all good values
checkEquals(length(which(is.na(mtx.mrna))), 882018)
checkEquals(fivenum(mtx.mrna), c(-5.8948,    -0.5639,    -0.2081,     0.2971, 20121.9727))
                                 
save(mtx.mrna, file="../../extdata/mtx.mrna.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))
