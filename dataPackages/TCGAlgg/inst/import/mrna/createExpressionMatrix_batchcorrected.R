load("../../../../RawData/TCGAbrain/combatAdjustedExp654gdBatchesNormLGGNormGBM.RData")
table.mrna <- adjustedExpCombat
## 18641 genes x 654 samples 

load("../../../../RawData/TCGAlgg/allExp527SampleIDsLGG.RData")
lgg.exp.samples <- intersect(colnames(table.mrna), samplesLGG)

table.mrna <- table.mrna[,lgg.exp.samples]
mtx.mrna.bc <- t(table.mrna)

checkEquals(dim(mtx.mrna.bc), c(513, 18641))
  # all good values
checkEquals(length(which(is.na(mtx.mrna.bc))), 0)
checkEquals(fivenum(mtx.mrna.bc), c(-0.2778500,  0.4910168,  1.0257038,  1.5111590,  2.5698982))
                                 
save(mtx.mrna.bc, file="../../extdata/mtx.mrna.bc.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))
