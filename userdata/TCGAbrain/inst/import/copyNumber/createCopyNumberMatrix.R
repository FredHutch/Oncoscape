library(RUnit)

load(file="../../../../TCGAgbm/inst/extdata/mtx.cn.RData")
tbl.TCGAgbm <- mtx.cn
checkEquals(dim(tbl.TCGAgbm), c(563, 23575))

load(file="../../../../TCGAlgg/inst/extdata/mtx.cn.RData")
tbl.TCGAlgg <- mtx.cn
checkEquals(dim(tbl.TCGAlgg), c(513, 22184))

genes.gbm <- colnames(tbl.TCGAgbm)
genes.lgg <- colnames(tbl.TCGAlgg)

Addgene <- setdiff(genes.gbm, genes.lgg)
if(length(Addgene)>0) tbl.TCGAlgg <- cbind(tbl.TCGAlgg, matrix(NA, nrow=nrow(tbl.TCGAlgg), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlgg),Addgene)))
Addgene <- setdiff(genes.lgg, genes.gbm)
if(length(Addgene)>0) tbl.TCGAgbm <- cbind(tbl.TCGAgbm, matrix(NA, nrow=nrow(tbl.TCGAgbm), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAgbm),Addgene)))

HugoGenes <- unique(c(genes.gbm, genes.lgg))
checkEquals(length(HugoGenes), ncol(tbl.TCGAgbm))
checkEquals(length(HugoGenes), ncol(tbl.TCGAlgg))

mtx.cn <- rbind(tbl.TCGAgbm, tbl.TCGAlgg)

checkEquals(nrow(mtx.cn), nrow(tbl.TCGAgbm) + nrow(tbl.TCGAlgg) )
checkEquals(as.list(table(mtx.cn)), list(`-2`=95773,`-1`=3380402,  `0`=18618648, `1`=2435083, `2`=123211))
save(mtx.cn, file="../../extdata/mtx.cn.RData")


