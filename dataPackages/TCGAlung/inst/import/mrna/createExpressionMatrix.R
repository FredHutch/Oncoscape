library(RUnit)
library(R.utils)
#---------------------mtx.mrna_Seq------------------------------
load(file="../../../../TCGAluad/inst/extdata/mtx.mrna_Seq.RData")
tbl.TCGAluad <- mtx.mrna_Seq
checkEquals(dim(tbl.TCGAluad), c(490, 20444))

load(file="../../../../TCGAlusc/inst/extdata/mtx.mrna_Seq.RData")
tbl.TCGAlusc <- mtx.mrna_Seq
checkEquals(dim(tbl.TCGAlusc), c(501, 20444))

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

mtx.mrna_Seq <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.mrna_Seq), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )

checkEquals(dim(mtx.mrna_Seq), c(991, 20444))
  # all good values
checkEquals(length(which(is.na(mtx.mrna_Seq))), 1496994)
checkEquals(fivenum(mtx.mrna_Seq), c( -4.8681 , -0.5608 , -0.2107, 0.2755,38659.0448))
                                 
save(mtx.mrna_Seq, file="../../extdata/mtx.mrna_Seq.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna_Seq), ncol(mtx.mrna_Seq))

#---------------------mtx.mrna_Agi------------------------------

load(file="../../../../TCGAluad/inst/extdata/mtx.mrna_Agi.RData")
tbl.TCGAluad <- mtx.mrna_Agi
checkEquals(dim(tbl.TCGAluad), c(32, 17212))

load(file="../../../../TCGAlusc/inst/extdata/mtx.mrna_Agi.RData")
tbl.TCGAlusc <- mtx.mrna
checkEquals(dim(tbl.TCGAlusc), c(154, 17212))

genes.luad <- colnames(tbl.TCGAluad)
genes.lusc <- colnames(tbl.TCGAlusc)

Addgene <- setdiff(genes.luad, genes.lusc)
if(length(Addgene)>0) tbl.TCGAlusc <- cbind(tbl.TCGAlusc, matrix(NA, nrow=nrow(tbl.TCGAlusc), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlusc),Addgene)))
Addgene <- setdiff(genes.lusc, genes.luad)
if(length(Addgene)>0) tbl.TCGAluad <- cbind(tbl.TCGAluad, matrix(NA, nrow=nrow(tbl.TCGAluad), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAluad),Addgene)))

HugoGenes <- unique(c(genes.luad, genes.lusc))
checkEquals(length(HugoGenes), ncol(tbl.TCGAluad))
checkEquals(length(HugoGenes), ncol(tbl.TCGAlusc))

mtx.mrna_Agi <- rbind(tbl.TCGAluad, tbl.TCGAlusc)

checkEquals(nrow(mtx.mrna_Agi), nrow(tbl.TCGAluad) + nrow(tbl.TCGAlusc) )

checkEquals(dim(mtx.mrna_Agi), c(186, 17212))
# all good values
checkEquals(length(which(is.na(mtx.mrna_Agi))), 75708)
checkEquals(fivenum(mtx.mrna_Agi), c(-28.7792, -0.7257,-0.0585,0.6586,47.0682))

save(mtx.mrna_Agi, file="../../extdata/mtx.mrna_Agi.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna_Agi), ncol(mtx.mrna_Agi))

#---------------------mtx.mrna_U133------------------------------

load(file="../../../../TCGAlusc/inst/extdata/mtx.mrna_U133.RData")
#tbl.TCGAlusc <- mtx.mrna

checkEquals(dim(mtx.mrna), c(133,11878))


checkEquals(length(which(is.na(mtx.mrna))),18354)
checkEquals(fivenum(mtx.mrna), c( -9.9347,-0.6941 ,-0.0825 , 0.6419 ,61.9539))

save(mtx.mrna, file="../../extdata/mtx.mrna_U133.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))

