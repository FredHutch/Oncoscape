library(RUnit)

table.mrna <- read.table(file="../../../../RawData/TCGAgbm/ueGbmBatches1to10and16.txt", header=T,row.names=1, as.is=T)
## 334 samples x 11864 genes

BarcodeSample <- colnames(table.mrna)
BarcodeSample <- gsub("\\w\\.\\d\\d\\w$", "", BarcodeSample)
Deleters <- which(sapply(BarcodeSample, function(id) grepl("\\.11$|\\.20$", id)))
colnames(table.mrna) <- BarcodeSample

table.mrna <- table.mrna[,-Deleters]
table.mrna <- round(table.mrna, digits=5)
mtx.mrna.ueArray <- t(table.mrna)


checkEquals(dim(mtx.mrna.ueArray), c(323, 11864))
checkEquals(length(which(is.na(mtx.mrna.ueArray))), 436)
checkEquals(fivenum(mtx.mrna.ueArray), c(-8.90925, -0.58493, -0.03335,  0.55281, 15.54740))
                                 
save(mtx.mrna.ueArray, file="../../extdata/mtx.mrna.ueArray.RData")
