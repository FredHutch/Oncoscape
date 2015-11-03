library(RUnit)
load("../sharedPatientsAndGenes.RData")
print(load("~/oncodev/hbolouri/oncoDev12/Oncoscape/inst/extdata/tcgaGBM/cnvGBM-563patients-1582genes.RData"))

mtx.cn <- as.matrix(tbl.cn[patients, genes])
checkEquals(as.list(table(mtx.cn)), list(`-2`=9, `-1`=120, `0`=926, `1`=210, `2`=15))
save(mtx.cn, file="../../extdata/mtx.cn.RData")


