library(RUnit)

load(file="../../../../TCGAluad/inst/extdata/mtx.prot.RData")
tbl.TCGAluad <- mtx.prot
checkEquals(dim(tbl.TCGAluad), c(181, 160))

load(file="../../../../TCGAlusc/inst/extdata/mtx.prot.RData")
tbl.TCGAlusc <- mtx.prot
checkEquals(dim(tbl.TCGAlusc), c(195,174))

proteins.luad <- colnames(tbl.TCGAluad)
proteins.lusc <- colnames(tbl.TCGAlusc)

Addgene <- setdiff(proteins.luad, proteins.lusc)
if(length(Addgene)>0) tbl.TCGAlusc <- cbind(tbl.TCGAlusc, matrix(NA, nrow=nrow(tbl.TCGAlusc), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlusc),Addgene)))
Addgene <- setdiff(proteins.lusc, proteins.luad)
if(length(Addgene)>0) tbl.TCGAluad <- cbind(tbl.TCGAluad, matrix(NA, nrow=nrow(tbl.TCGAluad), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAluad),Addgene)))

protIDs <- unique(c(proteins.luad, proteins.lusc))
checkEquals(length(protIDs), ncol(tbl.TCGAluad))
checkEquals(length(protIDs), ncol(tbl.TCGAlusc))

tbl.TCGAluad <- tbl.TCGAluad[, colnames(tbl.TCGAlusc)]

mtx.prot <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.prot), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )

checkEquals(mtx.prot["TCGA.78.7536.01", "p53-R-E"], 1.602750720 )
checkEquals(fivenum(mtx.prot), c(-5.39682915, -0.63367623, -0.07445666,  0.55577806, 9.95972284))

checkEquals(dim(mtx.prot), c(376, 228))

checkTrue(all(unlist(lapply(mtx.prot, class), use.names=FALSE) == "numeric"))
save(mtx.prot, file="../../extdata/mtx.prot.RData")
