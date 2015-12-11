library(RUnit)

load(file="../../../../TCGAgbm/inst/extdata/mtx.prot.RData")
tbl.TCGAgbm <- mtx.prot
checkEquals(dim(tbl.TCGAgbm), c(214, 171))

load(file="../../../../TCGAlgg/inst/extdata/mtx.prot.RData")
tbl.TCGAlgg <- mtx.prot
checkEquals(dim(tbl.TCGAlgg), c(260,189))

proteins.gbm <- colnames(tbl.TCGAgbm)
proteins.lgg <- colnames(tbl.TCGAlgg)

Addgene <- setdiff(proteins.gbm, proteins.lgg)
if(length(Addgene)>0) tbl.TCGAlgg <- cbind(tbl.TCGAlgg, matrix(NA, nrow=nrow(tbl.TCGAlgg), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAlgg),Addgene)))
Addgene <- setdiff(proteins.lgg, proteins.gbm)
if(length(Addgene)>0) tbl.TCGAgbm <- cbind(tbl.TCGAgbm, matrix(NA, nrow=nrow(tbl.TCGAgbm), ncol=length(Addgene), dimnames = list(rownames(tbl.TCGAgbm),Addgene)))

protIDs <- unique(c(proteins.gbm, proteins.lgg))
checkEquals(length(protIDs), ncol(tbl.TCGAgbm))
checkEquals(length(protIDs), ncol(tbl.TCGAlgg))

tbl.TCGAlgg <- tbl.TCGAlgg[, colnames(tbl.TCGAgbm)]

mtx.prot <- rbind(tbl.TCGAgbm, tbl.TCGAlgg)

checkEquals(nrow(mtx.prot), nrow(tbl.TCGAgbm) + nrow(tbl.TCGAlgg) )

checkEquals(mtx.prot["TCGA.02.0003", "14-3-3_epsilon-M-C"], -0.56391151)
checkEquals(fivenum(mtx.prot), c(-5.62437370, -0.63164617, -0.08118609,  0.54996781, 10.30523290))

checkEquals(dim(mtx.prot), c(474, 264))

checkTrue(all(unlist(lapply(mtx.prot, class), use.names=FALSE) == "numeric"))
save(mtx.prot, file="../../extdata/mtx.prot.RData")
