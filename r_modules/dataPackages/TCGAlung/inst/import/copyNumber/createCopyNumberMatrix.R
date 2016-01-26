library(RUnit)

load(file="../../../../TCGAluad/inst/extdata/mtx.cn.RData")
tbl.TCGAluad <- mtx.cn
checkEquals(dim(tbl.TCGAluad), c(515, 22184))

load(file="../../../../TCGAlusc/inst/extdata/mtx.cn.RData")
tbl.TCGAlusc <- mtx.cn
checkEquals(dim(tbl.TCGAlusc), c(501, 22184))

genes.luad <- colnames(tbl.TCGAluad)
genes.lusc <- colnames(tbl.TCGAlusc)

Addgene <- setdiff(genes.luad, genes.lusc)
if(length(Addgene)>0) tbl.TCGAlusc <- cbind(tbl.TCGAlusc, matrix(NA, nrow=nrow(tbl.TCGAlusc), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlusc),Addgene)))
Addgene <- setdiff(genes.lusc, genes.luad)
if(length(Addgene)>0) tbl.TCGAluad <- cbind(tbl.TCGAluad, matrix(NA, nrow=nrow(tbl.TCGAluad), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAluad),Addgene)))

HugoGenes <- unique(c(genes.luad, genes.lusc))
checkEquals(length(HugoGenes), ncol(tbl.TCGAluad))
checkEquals(length(HugoGenes), ncol(tbl.TCGAlusc))

tbl.TCGAluad <- tbl.TCGAluad[, colnames(tbl.TCGAlusc)]

mtx.cn <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.cn), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )
checkEquals(as.list(table(mtx.cn)), list(`-2`=125429,`-1`=6230316,  `0`=10035141, `1`=5711892, `2`=436166))
save(mtx.cn, file="../../extdata/mtx.cn.RData")


