library(RUnit)
#------------mtx.methHM450---------------------
load(file="../../../../TCGAluad/inst/extdata/mtx.methHM450.RData")
tbl.TCGAluad <- mtx.meth
checkEquals(dim(tbl.TCGAluad), c(451, 16183))

load(file="../../../../TCGAlusc/inst/extdata/mtx.methHM450.RData")
tbl.TCGAlusc <- mtx.meth
checkEquals(dim(tbl.TCGAlusc), c(359, 16350))

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

mtx.meth <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.meth), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )

checkEquals(fivenum(mtx.meth), c(0.004365384, 0.054082593, 0.336544430, 0.718516663, 0.995690633))
save(mtx.meth, file="../../extdata/mtx.methHM450.RData")

#------------mtx.methHM27---------------------
load(file="../../../../TCGAluad/inst/extdata/mtx.methHM27.RData")
tbl.TCGAluad <- mtx.meth
checkEquals(dim(tbl.TCGAluad), c(126, 1637))

load(file="../../../../TCGAlusc/inst/extdata/mtx.methHM27.RData")
tbl.TCGAlusc <- mtx.meth
checkEquals(dim(tbl.TCGAlusc), c(133, 1645))

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

mtx.meth <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.meth), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )

checkEquals(fivenum(mtx.meth), c(0.004523024,0.043203067,0.231726016,0.643797684,0.994422364))
save(mtx.meth, file="../../extdata/mtx.methHM27.RData")
