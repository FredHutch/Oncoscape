library(RUnit)
load("../sharedPatientsAndGenes.RData")
print(load("../../../../TCGAgbm/inst/extdata/mtx.meth.RData"))

int.patients <- intersect(patients, rownames(mtx.meth))  #11 patients not in methylation data
int.genes    <- intersect(genes   , colnames(mtx.meth))  #6  genes    not in methylation data
mtx.meth <- mtx.meth[int.patients,int.genes]

checkEquals(dim(mtx.meth), c(9, 58))
checkEquals(length(which(is.na(mtx.meth))), 1)   
checkEquals(mtx.meth["TCGA.02.0014", "EDIL3"], 0.04671, tolerance=10e-5)
checkEquals(fivenum(mtx.meth), c(0.01123, 0.05606, 0.12111, 0.63854, 0.97347))

save(mtx.meth, file="../../extdata/mtx.meth.RData")




