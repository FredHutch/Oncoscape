library(RUnit)
load("../sharedPatientsAndGenes.RData")
print(load("../../../../TCGAgbm/inst/extdata/mtx.prot.RData"))

int.patients <- intersect(patients, rownames(mtx.prot))  #17 patients not in protein data
mtx.prot <- mtx.prot[int.patients,]

checkEquals(mtx.prot["TCGA.02.0014", "14-3-3_epsilon-M-C"], 0.01180487, tolerance=10e-5)
checkEquals(fivenum(mtx.prot), c(-3.07801290, -0.67191718, -0.08856648,  0.65267073,  6.46917987))

checkEquals(dim(mtx.prot), c(3, 171))
checkEquals(length(which(is.na(mtx.prot))), 0)   #  no NAs

checkTrue(all(unlist(lapply(mtx.prot, class), use.names=FALSE) == "numeric"))
save(mtx.prot, file="../../extdata/mtx.prot.RData")
