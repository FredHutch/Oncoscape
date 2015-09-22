library(RUnit)

load(file="../../../../TCGAluad/inst/extdata/mtx.mut.RData")
tbl.TCGAluad <- mtx.mut
checkEquals(dim(tbl.TCGAluad), c(229, 14985))

load(file="../../../../TCGAlusc/inst/extdata/mtx.mut.RData")
tbl.TCGAlusc <- mtx.mut
checkEquals(dim(tbl.TCGAlusc), c(178, 13511))

genes.luad <- colnames(tbl.TCGAluad)
genes.lusc <- colnames(tbl.TCGAlusc)

Addgene <- setdiff(genes.luad, genes.lusc)
if(length(Addgene)>0) tbl.TCGAlusc <- cbind(tbl.TCGAlusc, matrix(NA, nrow=nrow(tbl.TCGAlusc), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlusc),Addgene)))
Addgene <- setdiff(genes.lusc, genes.luad)
if(length(Addgene)>0) tbl.TCGAluad <- cbind(tbl.TCGAluad, matrix(NA, nrow=nrow(tbl.TCGAluad), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAluad),Addgene)))

HugoGenes <- unique(c(genes.luad, genes.lusc))
checkEquals(length(HugoGenes), ncol(tbl.TCGAluad))
checkEquals(length(HugoGenes), ncol(tbl.TCGAlusc))

mtx.mut <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.mut), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )

save(mtx.mut, file="../../extdata/mtx.mut.RData")


